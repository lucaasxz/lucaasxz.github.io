import { h, Fragment } from 'preact';
// `/acompanhar/:id?t=` — a pessoa vê a própria inscrição pelo link com token.
// Com a vaga reservada, é AQUI que ela paga depois: a chave Pix, o prazo e o
// anexo do comprovante (adendo de 20/10). Na fila, vê a posição. O convidado
// sorteado (adendo 4) é pago aqui também, com o prazo dele.
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MODALIDADES } from '../lib/regras.js';
import { BotaoCopiar, BotaoPrincipal, CodigoDaInscricao } from '../components/inscricao/controles.js';
import CabecalhoEvento from '../components/marca/CabecalhoEvento.js';
import { buscarAcompanhamento, buscarVagas, enviarComprovanteDepois, } from '../lib/api-publica.js';
import { prepararComprovante } from '../lib/comprovante.js';
import { dataHora, reais } from '../lib/formato.js';
import { MolduraEvento } from './InscricaoPage.js';
function situacaoLegivel(a) {
    switch (a.situacao) {
        case 'aguardando_pagamento':
            return {
                titulo: a.prazoPagamento ? `Vaga reservada: pague até ${dataHora(a.prazoPagamento)}` : 'Vaga reservada: falta pagar',
                texto: 'Pague pelo Pix e anexe o comprovante aqui. Sem o pagamento no prazo, a vaga volta para a fila.',
            };
        case 'lista_espera':
            return {
                titulo: a.posicaoNaFila ? `Você é o nº ${a.posicaoNaFila} da lista de espera` : 'Você está na lista de espera',
                texto: 'Quando chegar a sua vez, esta página mostra o prazo para pagar. Não pague agora.',
            };
        case 'pendente':
            return { titulo: 'Aguardando conferência do pagamento' };
        case 'confirmada':
            return { titulo: 'Inscrição confirmada' };
        case 'recusada':
            return { titulo: 'Pagamento não confirmado', texto: a.motivo ?? undefined };
        case 'cancelada':
            return { titulo: 'Inscrição cancelada', texto: a.motivo ?? undefined };
        case 'expirada':
            return { titulo: 'O prazo para pagar terminou', texto: 'A vaga voltou para a fila. Fale com a organização.' };
    }
}
/** O que a pessoa lê sobre o convidado, pela situação dele. */
function situacaoDoConvidado(situacao) {
    switch (situacao) {
        case 'lista_espera':
            return 'Na lista de espera dos convidados: se for sorteado, a organização avisa. Não pague por ele agora.';
        case 'aguardando_pagamento':
            return 'Sorteado! Pague a parte dele no prazo, logo acima.';
        case 'pendente':
            return 'Comprovante do convidado enviado: aguardando a conferência.';
        case 'confirmada':
            return 'Confirmado.';
        case 'expirada':
            return 'O prazo para pagar o convidado terminou. Fale com a organização.';
        default:
            return 'Fale com a organização sobre o convidado.';
    }
}
function PagarDepois({ id, t, vagas, aoEnviar, de = 'colaborador', }) {
    const [comprovante, setComprovante] = useState(null);
    const [erro, setErro] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    async function escolher(arquivo) {
        if (!arquivo)
            return;
        setOcupado(true);
        setErro(null);
        const r = await prepararComprovante(arquivo);
        setOcupado(false);
        if (r.ok)
            setComprovante(r.comprovante);
        else
            setErro(r.erro);
    }
    async function enviar() {
        if (!comprovante)
            return;
        setOcupado(true);
        const r = await enviarComprovanteDepois(id, t, { nome: comprovante.nome, base64: comprovante.base64 }, de);
        setOcupado(false);
        if (r.ok)
            aoEnviar();
        else
            setErro(r.erro);
    }
    return (h("div", { className: "grid gap-3" },
        vagas && (h("div", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Chave Pix"),
            h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
                h("code", { className: "font-sans text-xl font-semibold" }, vagas.pix.chave),
                h(BotaoCopiar, { texto: vagas.pix.chave, rotulo: "Copiar chave", feito: "Chave copiada!" })),
            h("p", { className: "text-sm text-texto-suave" }, vagas.pix.texto))),
        h("div", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Comprovante do Pix"),
            comprovante ? (h("div", { className: "flex items-center gap-2 rounded-xl bg-trilho px-3 py-2 text-sm" },
                h("span", { className: "min-w-0 flex-1 truncate" }, comprovante.nome),
                h("button", { type: "button", className: "min-h-11 px-2 underline", onClick: () => setComprovante(null) }, "trocar"))) : (h("label", { className: "grid min-h-12 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-borda px-3 py-3 text-center font-semibold" },
                ocupado ? 'Preparando o arquivo…' : 'Escolher arquivo ou tirar foto',
                h("input", { type: "file", accept: "image/*,application/pdf,.heic,.heif", className: "sr-only", disabled: ocupado, onChange: (e) => {
                        void escolher(e.target.files?.[0]);
                        e.target.value = '';
                    } }))),
            erro && (h("p", { role: "alert", className: "text-sm font-semibold text-perigo" }, erro))),
        h(BotaoPrincipal, { onClick: () => void enviar(), disabled: !comprovante || ocupado }, ocupado && comprovante ? 'Enviando…' : 'Enviar comprovante')));
}
export default function AcompanharPage() {
    const { id = '' } = useParams();
    const [busca] = useSearchParams();
    const t = busca.get('t') ?? '';
    const [estado, setEstado] = useState('carregando');
    const [vagas, setVagas] = useState(null);
    const carregar = useCallback(() => {
        buscarAcompanhamento(id, t)
            .then((a) => setEstado(a ?? 'nao'))
            .catch(() => setEstado('falhou'));
    }, [id, t]);
    useEffect(() => {
        carregar();
        buscarVagas().then(setVagas).catch(() => setVagas(null));
    }, [carregar]);
    return (h(MolduraEvento, null,
        h(CabecalhoEvento, { chamada: "Sua inscri\u00E7\u00E3o" }),
        h("div", { className: "grid gap-3 px-4" },
            estado === 'carregando' && h("p", { className: "text-texto-suave" }, "Carregando\u2026"),
            estado === 'nao' && h("p", { role: "alert", className: "font-semibold" }, "Inscri\u00E7\u00E3o n\u00E3o encontrada. Confira o link."),
            estado === 'falhou' && h("p", { role: "alert", className: "font-semibold" }, "N\u00E3o foi poss\u00EDvel carregar agora. Tente de novo em instantes."),
            typeof estado === 'object' && (h(Fragment, null,
                h(CodigoDaInscricao, { codigo: estado.codigo }),
                h("p", { className: "text-center font-display text-[30px] font-extrabold uppercase italic leading-[0.95] [text-wrap:balance]" }, situacaoLegivel(estado).titulo),
                situacaoLegivel(estado).texto && h("p", { className: "text-[15px] text-texto-suave" }, situacaoLegivel(estado).texto),
                estado.situacao === 'aguardando_pagamento' && (h(PagarDepois, { id: id, t: t, vagas: vagas, aoEnviar: () => carregar() })),
                estado.convidado?.situacao === 'aguardando_pagamento' && (h("section", { className: "grid gap-3 rounded-2xl border-2 border-destaque bg-superficie p-4" },
                    h("p", { className: "font-display text-[26px] font-extrabold uppercase italic leading-none" }, "Seu convidado foi sorteado!"),
                    h("p", { className: "text-sm text-texto-suave" },
                        "Pague ",
                        estado.convidado.valorDevido !== null ? reais(estado.convidado.valorDevido) : 'a parte dele',
                        " por",
                        ' ',
                        estado.convidado.nome,
                        estado.convidado.prazoPagamento ? ` até ${dataHora(estado.convidado.prazoPagamento)}` : '',
                        " e anexe o comprovante. Sem o pagamento no prazo, a vaga volta para a fila."),
                    h(PagarDepois, { id: id, t: t, vagas: vagas, aoEnviar: () => carregar(), de: "convidado" }))),
                h("dl", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4 text-sm" },
                    h("div", null,
                        h("dt", { className: "text-texto-suave" }, "Nome"),
                        h("dd", { className: "font-semibold" }, estado.nome)),
                    h("div", null,
                        h("dt", { className: "text-texto-suave" }, "Turno"),
                        h("dd", { className: "font-semibold" }, estado.grupo)),
                    h("div", null,
                        h("dt", { className: "text-texto-suave" }, "Valor"),
                        h("dd", { className: "font-semibold" }, reais(estado.valorDevido))),
                    estado.convidado && (h("div", null,
                        h("dt", { className: "text-texto-suave" }, "Convidado"),
                        h("dd", { className: "font-semibold" },
                            estado.convidado.nome,
                            " \u00B7 ",
                            MODALIDADES[estado.convidado.modalidade],
                            h("span", { className: "block font-normal text-texto-suave" }, situacaoDoConvidado(estado.convidado.situacao))))),
                    estado.criancas > 0 && (h("div", null,
                        h("dt", { className: "text-texto-suave" }, "Crian\u00E7as nas brincadeiras"),
                        h("dd", { className: "font-semibold" }, estado.criancas)))),
                (estado.situacao === 'expirada' || estado.situacao === 'recusada') && vagas?.whatsapp && (h("p", { className: "text-sm text-texto-suave" },
                    "Organiza\u00E7\u00E3o: WhatsApp ",
                    h("b", { className: "whitespace-nowrap text-texto" }, vagas.whatsapp))),
                ['pendente', 'aguardando_pagamento'].includes(estado.situacao) && (h("p", { className: "border-l-4 border-destaque pl-3 text-sm text-texto-suave" }, "O preenchimento n\u00E3o garante a vaga; ela \u00E9 confirmada ap\u00F3s a confer\u00EAncia do pagamento.")))))));
}
