import { h, Fragment } from 'preact';
// /org — o painel (adendo 5, como a maquete): a contagem para a largada, o
// placar com o que pede ação primeiro, a ocupação de cada turno como uma raia
// da pista, as reservas com o tempo que falta (inclusive de convidado sorteado)
// e as duas filas: colaboradores, por turno e na ordem de chegada, e convidados,
// com o sorteio por turno (adendo 4: só com vaga e sem colaborador na fila).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import RaiaDeOcupacao from '../../components/org/RaiaDeOcupacao.js';
import { Aviso, Botao, Cartao, Etiqueta, Numero } from '../../components/org/ui.js';
import { apiOrg, posicoesNaFila, rotuloSituacao, tempoRestante } from '../../lib/api-org.js';
import { ROTULO_LARGADA, diasParaLargada } from '../../lib/evento.js';
import { dataHora, mascaraTelefone, reais } from '../../lib/formato.js';
import { useCarga } from '../../lib/use-carga.js';
function Mini({ rotulo, valor }) {
    return (h("div", { className: "grid gap-0.5 rounded-xl bg-superficie px-3.5 py-2.5" },
        h("span", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, rotulo),
        h("b", { className: "font-display text-2xl font-extrabold italic tabular-nums" }, valor)));
}
/** O sorteio dos convidados de um turno (adendo 4). */
function SorteioDoTurno({ g, aoSortear }) {
    const livres = Math.max(0, g.cotaColaborador - g.ocupadasColaborador - g.ocupadasConvidado);
    const maximo = Math.min(livres, g.sorteaveis);
    // começa em 1: um clique não reserva todas as vagas livres para convidados
    const [quantidade, setQuantidade] = useState('1');
    const [ocupado, setOcupado] = useState(false);
    const [msg, setMsg] = useState(null);
    const motivo = g.fila > 0 ? `${g.fila} ${g.fila === 1 ? 'colaborador' : 'colaboradores'} na fila: a vaga é deles` : livres === 0 ? 'sem vaga livre' : null;
    async function sortear() {
        setOcupado(true);
        setMsg(null);
        try {
            const r = await apiOrg.sortear(g.id, Number(quantidade));
            setMsg({ tom: 'sucesso', texto: `Sorteados: nº ${r.sorteados.join(', ')}. Avise pelo telefone: o prazo para pagar aparece no link deles.` });
            aoSortear();
        }
        catch (e) {
            setMsg({ tom: 'perigo', texto: e.message });
        }
        finally {
            setOcupado(false);
        }
    }
    return (h("div", { className: "grid gap-2 rounded-xl bg-superficie-2 px-3 py-2.5" },
        h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
            h("span", { className: "font-bold" },
                g.nome,
                h("small", { className: "block font-medium text-texto-suave" },
                    g.sorteaveis,
                    " ",
                    g.sorteaveis === 1 ? 'convidado pode' : 'convidados podem',
                    " ser sorteados (colaborador confirmado) \u00B7 ",
                    livres,
                    ' ',
                    livres === 1 ? 'vaga livre' : 'vagas livres')),
            motivo ? (h(Etiqueta, null, motivo)) : (h("span", { className: "flex items-center gap-2" },
                h("label", { className: "sr-only", htmlFor: `sorteio-${g.id}` },
                    "Quantos sortear em ",
                    g.nome),
                h("input", { id: `sorteio-${g.id}`, inputMode: "numeric", className: "h-11 w-16 rounded-xl border-2 border-borda bg-superficie px-2 text-center font-bold", value: quantidade, onChange: (e) => setQuantidade(e.target.value.replace(/\D/g, '').slice(0, 3)) }),
                h(Botao, { variante: "primario", disabled: ocupado || !Number(quantidade) || Number(quantidade) > maximo, onClick: () => void sortear() }, ocupado ? 'Sorteando…' : 'Sortear')))),
        msg && h(Aviso, { tom: msg.tom }, msg.texto)));
}
export default function PainelPage() {
    const painel = useCarga(() => apiOrg.painel(), []);
    const reservas = useCarga(() => apiOrg.inscricoes({ situacao: 'aguardando_pagamento' }), []);
    const reservasConvidado = useCarga(() => apiOrg.inscricoes({ convidados: 'reserva' }), []);
    const fila = useCarga(() => apiOrg.inscricoes({ situacao: 'lista_espera' }), []);
    const convidados = useCarga(() => apiOrg.inscricoes({ convidados: 'fila' }), []);
    const [agora] = useState(() => new Date());
    const posicao = posicoesNaFila(fila.dados ?? []);
    const p = painel.dados;
    if (painel.erro)
        return h(Aviso, null, painel.erro);
    if (!p)
        return h("p", { className: "text-texto-suave" }, "Carregando\u2026");
    const dias = diasParaLargada(agora);
    const cotaTotal = p.grupos.reduce((s, g) => s + g.cotaColaborador, 0);
    const ocupadasTotal = p.grupos.reduce((s, g) => s + g.ocupadasColaborador + g.ocupadasConvidado, 0);
    const paraConferir = p.pendentes + p.convidadosParaConferir;
    const todasReservas = [
        ...(reservas.dados ?? []).filter((i) => i.prazoPagamento).map((i) => ({ i, quem: 'colaborador', prazo: i.prazoPagamento })),
        ...(reservasConvidado.dados ?? [])
            .filter((i) => i.convidado?.prazoPagamento)
            .map((i) => ({ i, quem: 'convidado', prazo: i.convidado.prazoPagamento })),
    ].sort((a, b) => a.prazo.localeCompare(b.prazo));
    const filaPorTurno = p.grupos
        .map((g) => ({ g, pessoas: (fila.dados ?? []).filter((i) => i.grupoId === g.id) }))
        .filter((t) => t.pessoas.length > 0);
    const recarregarTudo = () => {
        painel.recarregar();
        reservasConvidado.recarregar();
        convidados.recarregar();
    };
    return (h("div", { className: "grid gap-5" },
        h("section", { className: "flex flex-wrap items-end justify-between gap-4" },
            h("div", null,
                h("h1", { className: "font-display text-[44px] font-extrabold uppercase italic leading-[0.9] md:text-[54px]" }, dias > 0 ? (h(Fragment, null,
                    "Largada em ",
                    h("em", { className: "text-cta" },
                        dias,
                        " ",
                        dias === 1 ? 'dia' : 'dias'))) : ('Dia de corrida!')),
                h("p", { className: "mt-1.5 text-texto-suave" }, `${ROTULO_LARGADA.charAt(0).toUpperCase()}${ROTULO_LARGADA.slice(1)} · inscrição presencial no balcão da organização`)),
            h("div", { className: "flex flex-wrap gap-2.5" },
                h(Mini, { rotulo: "Hoje", valor: `+${p.hoje}` }),
                h(Mini, { rotulo: "Vagas ocupadas", valor: `${ocupadasTotal}/${cotaTotal}` }))),
        h("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8" },
            h(Link, { to: "/org/conferencia", className: "col-span-2 md:col-span-1" },
                h(Numero, { chama: paraConferir > 0, rotulo: "Comprovantes para conferir", valor: paraConferir, detalhe: h(Fragment, null,
                        p.convidadosParaConferir > 0 && `${p.convidadosParaConferir} de convidado · `,
                        "abrir confer\u00EAncia \u2192") })),
            h(Numero, { rotulo: "Reservas sem pagamento", valor: todasReservas.length, detalhe: p.venceHoje > 0 ? h(Etiqueta, { tom: "alerta" },
                    p.venceHoje,
                    " vencem hoje") : 'nenhuma vence hoje' }),
            h(Numero, { rotulo: "Colaboradores na fila", valor: p.listaEspera, detalhe: "sobem sozinhos quando abre vaga" }),
            h(Numero, { rotulo: "Convidados na fila", valor: p.convidadosNaFila, detalhe: "entram pelo sorteio" }),
            h(Numero, { rotulo: "Confirmadas", valor: p.confirmadas, detalhe: "pagamento conferido" }),
            h(Numero, { rotulo: "A receber", valor: reais(p.aReceber) }),
            h(Numero, { rotulo: "Recebido", valor: reais(p.recebido) }),
            h(Numero, { rotulo: "Crian\u00E7as", valor: p.criancas, detalhe: "nas brincadeiras" })),
        h(Cartao, { titulo: "Ocupa\u00E7\u00E3o por turno", acao: h("span", { className: "flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-texto-suave" },
                h("span", { className: "flex items-center gap-1.5" },
                    h("i", { className: "inline-block h-2.5 w-4 rounded-sm bg-destaque" }),
                    "confirmadas"),
                h("span", { className: "flex items-center gap-1.5" },
                    h("i", { className: "faixa-andamento inline-block h-2.5 w-4 rounded-sm" }),
                    "confer\u00EAncia ou reserva"),
                h("span", { className: "flex items-center gap-1.5" },
                    h("i", { className: "inline-block h-2.5 w-4 rounded-sm bg-faixa" }),
                    "convidados sorteados"),
                h("span", { className: "flex items-center gap-1.5" },
                    h("i", { className: "trilho-livre inline-block h-2.5 w-4 rounded-sm" }),
                    "livres")) },
            h("div", { className: "grid gap-4" }, p.grupos.map((g, n) => (h(RaiaDeOcupacao, { key: g.id, numero: n + 1, nome: g.nome, cota: g.cotaColaborador, confirmadas: g.confirmadas, andamento: g.andamento, convidados: g.ocupadasConvidado, fila: g.fila }))))),
        h("div", { className: "grid gap-4 lg:grid-cols-2" },
            h(Cartao, { titulo: "Reservas sem pagamento", acao: h("span", { className: "text-sm text-texto-suave" }, "ligue antes do prazo") },
                todasReservas.length === 0 && h("p", { className: "text-sm text-texto-suave" }, "Nenhuma reserva aguardando pagamento."),
                h("ul", { className: "grid gap-2" }, todasReservas.map(({ i, quem, prazo }) => {
                    const resta = tempoRestante(prazo, agora);
                    return (h("li", { key: `${i.id}-${quem}`, className: "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-superficie-2 px-3 py-2.5" },
                        h("span", { className: "font-display text-xl font-extrabold italic tabular-nums" }, i.codigo),
                        h("span", { className: "min-w-0 font-semibold leading-tight" },
                            quem === 'convidado' ? `${i.convidado?.nome} (convidado sorteado)` : i.nome,
                            h("small", { className: "block font-medium text-texto-suave" },
                                quem === 'convidado' ? `de ${i.nome} · ` : '',
                                i.grupoNome,
                                " \u00B7 ",
                                mascaraTelefone(i.telefone))),
                        h("span", { className: "grid justify-items-end gap-1 text-right text-[13px] text-texto-suave" },
                            h(Etiqueta, { tom: resta.urgente ? 'alerta' : 'contorno' }, resta.texto),
                            reais(quem === 'convidado' ? (i.convidado?.valorDevido ?? 0) : i.valorDevido))));
                }))),
            h(Cartao, { titulo: "Lista de espera", acao: h("span", { className: "text-sm text-texto-suave" }, "por turno, na ordem de chegada") },
                h("div", { className: "grid gap-4" },
                    fila.erro && h(Aviso, null, fila.erro),
                    filaPorTurno.length === 0 && h("p", { className: "text-sm text-texto-suave" }, "Nenhum colaborador na fila."),
                    filaPorTurno.map(({ g, pessoas }) => (h("div", { key: g.id, className: "grid gap-2" },
                        h("h3", { className: "flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-texto-suave" },
                            g.nome,
                            " \u00B7 colaboradores ",
                            h(Etiqueta, null, pessoas.length)),
                        h("ul", { className: "grid gap-2" }, pessoas.map((i) => (h("li", { key: i.id, className: "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-superficie-2 px-3 py-2.5" },
                            h("span", { className: "min-w-8 font-display text-[22px] font-extrabold italic text-cta" },
                                posicao[i.id],
                                "\u00BA"),
                            h("span", { className: "min-w-0 font-semibold leading-tight" },
                                i.nome,
                                h("small", { className: "block font-medium text-texto-suave" },
                                    "c\u00F3digo ",
                                    i.codigo,
                                    " \u00B7 ",
                                    mascaraTelefone(i.telefone),
                                    i.convidado && ' · + convidado')),
                            h("span", { className: "text-right text-[13px] text-texto-suave" },
                                "desde ",
                                dataHora(i.criadoEm))))))))),
                    h("div", { className: "grid gap-2" },
                        h("h3", { className: "flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-texto-suave" },
                            "Convidados \u00B7 sorteio ",
                            h(Etiqueta, null, p.convidadosNaFila)),
                        h("p", { className: "text-sm text-texto-suave" }, "As vagas s\u00E3o dos colaboradores. Com vaga livre num turno e ningu\u00E9m na fila de colaboradores, sorteie entre os convidados de colaboradores j\u00E1 confirmados: o sorteado paga a parte dele pelo link de acompanhamento, no prazo."),
                        p.grupos
                            .filter((g) => g.sorteaveis > 0)
                            .map((g) => (h(SorteioDoTurno, { key: `${g.id}-${g.sorteaveis}-${g.fila}`, g: g, aoSortear: recarregarTudo }))),
                        convidados.erro && h(Aviso, null, convidados.erro),
                        convidados.dados?.length === 0 && h("p", { className: "text-sm text-texto-suave" }, "Nenhum convidado na lista de espera."),
                        h("ul", { className: "grid gap-2" }, convidados.dados?.map((i) => (h("li", { key: i.id, className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-superficie-2 px-3 py-2.5" },
                            h("span", { className: "min-w-0 font-semibold leading-tight" },
                                i.convidado?.nome,
                                h("small", { className: "block font-medium text-texto-suave" },
                                    "convidado de ",
                                    i.nome,
                                    " (",
                                    i.codigo,
                                    ") \u00B7 ",
                                    i.grupoNome)),
                            h("span", { className: "text-right text-[13px] text-texto-suave" },
                                "colaborador ",
                                rotuloSituacao(i.situacao).toLowerCase())))))))))));
}
