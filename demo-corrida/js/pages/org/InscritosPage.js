import { h, Fragment } from 'preact';
// /org/inscritos — TODAS as respostas, com todos os campos: filtros, a ficha
// completa (com o comprovante), confirmar, cancelar e as exportações.
import { useState } from 'react';
import { MODALIDADES } from '../../lib/regras.js';
import VisorDeComprovante from '../../components/org/VisorDeComprovante.js';
import { Aviso, Botao, Cartao, SeloSituacao } from '../../components/org/ui.js';
import { apiOrg, baixarCsv, rotuloSituacao } from '../../lib/api-org.js';
import { dataHora, mascaraTelefone, reais } from '../../lib/formato.js';
import { useCarga } from '../../lib/use-carga.js';
const SITUACOES = ['pendente', 'aguardando_pagamento', 'lista_espera', 'confirmada', 'recusada', 'cancelada', 'expirada'];
const VIVAS = ['pendente', 'aguardando_pagamento', 'lista_espera', 'confirmada'];
function Ficha({ i, aoMudar }) {
    const [motivo, setMotivo] = useState('');
    const [cancelando, setCancelando] = useState(false);
    const [levaConvidado, setLevaConvidado] = useState(false);
    // convidado sorteado ocupando vaga (reservado, pendente ou pago): cancelar leva ele junto
    const convidadoOcupa = !!i.convidado && ['pendente', 'confirmada', 'aguardando_pagamento'].includes(i.convidado.situacao);
    const [erro, setErro] = useState(null);
    async function agir(acao) {
        setErro(null);
        try {
            await acao();
            setCancelando(false);
            setMotivo('');
            aoMudar();
        }
        catch (e) {
            setErro(e.message);
        }
    }
    const linha = (rotulo, valor) => (h("div", { className: "grid grid-cols-[9rem_1fr] gap-2 border-b border-borda/40 py-1.5 text-sm" },
        h("dt", { className: "text-texto-suave" }, rotulo),
        h("dd", { className: "font-semibold" }, valor)));
    return (h(Cartao, { titulo: `Nº ${i.codigo} · ${i.nome}`, acao: h(SeloSituacao, { situacao: i.situacao }) },
        h("dl", null,
            linha('Matrícula', i.matricula),
            linha('Setor', i.setor),
            linha('Grupo', i.grupoNome),
            linha('Telefone', mascaraTelefone(i.telefone)),
            linha('Emergência', `${i.emergenciaNome} · ${mascaraTelefone(i.emergenciaTel)}`),
            linha('Prova', MODALIDADES[i.modalidade]),
            linha('Convidado', i.convidado ? `${i.convidado.nome} · ${MODALIDADES[i.convidado.modalidade]} · camiseta ${i.convidado.camiseta} · ${rotuloSituacao(i.convidado.situacao)}` : '—'),
            linha('Crianças', i.criancas > 0 ? `${i.criancas} nas brincadeiras` : '—'),
            linha('Uso de imagem', i.autorizaImagem === null ? 'Não perguntado (produção, sem termo)' : i.autorizaImagem ? 'Autoriza' : 'Não autoriza'),
            linha('Valor', reais(i.valorDevido)),
            i.convidado && i.convidado.valorDevido !== null && linha('Valor do convidado', reais(i.convidado.valorDevido)),
            i.convidado?.prazoPagamento && i.convidado.situacao === 'aguardando_pagamento' && linha('Convidado paga até', dataHora(i.convidado.prazoPagamento)),
            i.prazoPagamento && i.situacao === 'aguardando_pagamento' && linha('Pagar até', dataHora(i.prazoPagamento)),
            i.motivo && linha('Motivo', i.motivo),
            linha('Origem', i.origem === 'balcao' ? `Balcão (${i.registradoPor ?? '—'})` : 'Online'),
            linha('Inscrita em', dataHora(i.criadoEm)),
            i.conferidoPor && linha('Conferida por', `${i.conferidoPor}${i.conferidoEm ? ` em ${dataHora(i.conferidoEm)}` : ''}`)),
        h("div", { className: "mt-3" },
            h(VisorDeComprovante, { inscricaoId: i.id, tem: i.temComprovante })),
        i.convidado?.temComprovante && (h("div", { className: "mt-3 grid gap-1" },
            h("p", { className: "text-sm font-semibold" }, "Comprovante do convidado"),
            h(VisorDeComprovante, { inscricaoId: i.id, tem: true, de: "convidado" }))),
        h("div", { className: "mt-3 grid gap-2" },
            erro && h(Aviso, null, erro),
            (i.convidado?.situacao === 'pendente' || i.convidado?.situacao === 'aguardando_pagamento') && (h(Botao, { variante: "primario", onClick: () => void agir(() => apiOrg.conferirConvidado(i.id, 'confirmada')) }, "Confirmar pagamento do convidado")),
            (i.situacao === 'pendente' || i.situacao === 'aguardando_pagamento') && (h(Botao, { variante: "primario", onClick: () => void agir(() => apiOrg.conferir(i.id, 'confirmada')) }, "Confirmar pagamento")),
            VIVAS.includes(i.situacao) && !cancelando && h(Botao, { variante: "perigo", onClick: () => setCancelando(true) }, "Cancelar inscri\u00E7\u00E3o\u2026"),
            cancelando && (h(Fragment, null,
                h("label", { className: "grid gap-1 text-sm font-semibold" },
                    "Motivo do cancelamento",
                    h("textarea", { className: "min-h-16 rounded-xl border-2 border-borda bg-superficie p-2 text-base font-normal", value: motivo, onChange: (e) => setMotivo(e.target.value) })),
                convidadoOcupa && (h("label", { className: "flex items-start gap-2 rounded-xl border-2 border-alerta px-3 py-2 text-sm font-semibold" },
                    h("input", { type: "checkbox", className: "mt-0.5 h-5 w-5", checked: levaConvidado, onChange: (e) => setLevaConvidado(e.target.checked) }),
                    "O convidado ",
                    i.convidado?.nome,
                    " (",
                    rotuloSituacao(i.convidado.situacao).toLowerCase(),
                    ") sai junto: a vaga dele volta e o que ele pagou fica para a organiza\u00E7\u00E3o resolver.")),
                h(Botao, { variante: "perigo", disabled: motivo.trim().length < 3 || (convidadoOcupa && !levaConvidado), onClick: () => void agir(() => apiOrg.cancelar(i.id, motivo, convidadoOcupa && levaConvidado)) }, "Confirmar cancelamento"),
                h(Botao, { onClick: () => setCancelando(false) }, "Voltar"))))));
}
export default function InscritosPage() {
    const [filtros, setFiltros] = useState({ grupo: '', situacao: '', busca: '' });
    const [rascunho, setRascunho] = useState('');
    const [aberta, setAberta] = useState(null);
    const [erroCsv, setErroCsv] = useState(null);
    const painel = useCarga(() => apiOrg.painel(), []);
    const lista = useCarga(() => apiOrg.inscricoes(filtros), [filtros.grupo, filtros.situacao, filtros.busca]);
    const selecionada = lista.dados?.find((i) => i.id === aberta) ?? null;
    function buscar(e) {
        e.preventDefault();
        setFiltros((f) => ({ ...f, busca: rascunho.trim() }));
    }
    const exportar = (l) => baixarCsv(l).catch((e) => setErroCsv(e.message));
    return (h("div", { className: "grid gap-4" },
        h(Cartao, { titulo: `Inscritos${lista.dados ? ` (${lista.dados.length})` : ''}`, acao: h("div", { className: "flex flex-wrap gap-2" },
                h(Botao, { onClick: () => void exportar('kits') }, "Exportar kits (CSV)"),
                h(Botao, { onClick: () => void exportar('emergencia') }, "Lista de emerg\u00EAncia (CSV)")) },
            h("form", { onSubmit: buscar, className: "mb-3 flex flex-wrap gap-2" },
                h("select", { className: "min-h-11 rounded-xl border-2 border-borda bg-superficie px-2", value: filtros.grupo, onChange: (e) => setFiltros((f) => ({ ...f, grupo: e.target.value })), "aria-label": "Grupo" },
                    h("option", { value: "" }, "Todos os grupos"),
                    painel.dados?.grupos.map((g) => h("option", { key: g.id, value: g.id }, g.nome))),
                h("select", { className: "min-h-11 rounded-xl border-2 border-borda bg-superficie px-2", value: filtros.situacao, onChange: (e) => setFiltros((f) => ({ ...f, situacao: e.target.value })), "aria-label": "Situa\u00E7\u00E3o" },
                    h("option", { value: "" }, "Todas as situa\u00E7\u00F5es"),
                    SITUACOES.map((s) => h("option", { key: s, value: s }, rotuloSituacao(s)))),
                h("input", { className: "min-h-11 min-w-0 flex-1 basis-56 rounded-xl border-2 border-borda bg-superficie px-3", placeholder: "Nome, matr\u00EDcula ou n\u00FAmero", value: rascunho, onChange: (e) => setRascunho(e.target.value), "aria-label": "Buscar" }),
                h(Botao, { type: "submit" }, "Buscar")),
            erroCsv && h(Aviso, null, erroCsv),
            lista.erro && h(Aviso, null, lista.erro),
            h("div", { className: "overflow-x-auto" },
                h("table", { className: "w-full min-w-[56rem] text-left text-sm [&_td]:whitespace-nowrap" },
                    h("thead", { className: "text-texto-suave" },
                        h("tr", null, ['Nº', 'Nome', 'Matrícula', 'Grupo', 'Prova', 'Convidado', 'Telefone', 'Situação', 'Valor', 'Inscrita'].map((c) => (h("th", { key: c, className: "border-b border-borda/60 px-2 py-2 font-semibold" }, c))))),
                    h("tbody", null, lista.dados?.map((i) => (h("tr", { key: i.id, onClick: () => setAberta(i.id === aberta ? null : i.id), className: `cursor-pointer border-b border-borda/30 ${i.id === aberta ? 'bg-superficie-2' : ''}` },
                        h("td", { className: "px-2 py-2 font-bold" }, i.codigo),
                        h("td", { className: "px-2 py-2" }, i.nome),
                        h("td", { className: "px-2 py-2" }, i.matricula),
                        h("td", { className: "px-2 py-2" }, i.grupoNome),
                        h("td", { className: "px-2 py-2" }, MODALIDADES[i.modalidade]),
                        h("td", { className: "px-2 py-2" }, i.convidado ? `${i.convidado.nome} (${i.convidado.camiseta})${i.convidado.situacao === 'lista_espera' ? ' · na fila' : ''}` : '—'),
                        h("td", { className: "whitespace-nowrap px-2 py-2" }, mascaraTelefone(i.telefone)),
                        h("td", { className: "px-2 py-2" },
                            h(SeloSituacao, { situacao: i.situacao })),
                        h("td", { className: "whitespace-nowrap px-2 py-2" }, reais(i.valorDevido)),
                        h("td", { className: "whitespace-nowrap px-2 py-2" }, dataHora(i.criadoEm)))))))),
            lista.dados?.length === 0 && h("p", { className: "py-4 text-sm text-texto-suave" }, "Nenhuma inscri\u00E7\u00E3o com esses filtros.")),
        selecionada && h(Ficha, { i: selecionada, aoMudar: () => lista.recarregar() })));
}
