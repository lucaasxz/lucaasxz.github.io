import { h, Fragment } from 'preact';
// "Enviado" — o código da inscrição, a situação em
// linguagem simples (reserva com prazo, fila, conferência) e o link de
// acompanhamento, que é por onde se paga depois. A produção (21/10) não usa o
// link: paga o Pix e manda o comprovante para o WhatsApp da organização.
import { linkDeAcompanhamento } from '../../lib/api-publica.js';
import { dataHora, reais } from '../../lib/formato.js';
import { BotaoCopiar, BotaoPrincipal, CodigoDaInscricao } from './controles.js';
/** whatsapp: só da produção — o número para onde vai o comprovante ('' sem número na configuração). */
function textos(i, whatsapp) {
    const paraOWhatsapp = whatsapp ? `para o WhatsApp ${whatsapp}` : 'para o WhatsApp da organização';
    switch (i.situacao) {
        case 'confirmada':
            return { titulo: 'Inscrição confirmada!', texto: `Pagamento de ${reais(i.valorDevido)} conferido no balcão.` };
        case 'aguardando_pagamento': {
            const ate = i.prazoPagamento ? dataHora(i.prazoPagamento) : 'o prazo do link';
            return {
                titulo: 'Vaga reservada!',
                texto: whatsapp === null
                    ? `Pague ${reais(i.valorDevido)} até ${ate} e anexe o comprovante pelo link abaixo. Sem o pagamento, a vaga volta para a fila.`
                    : `Pague ${reais(i.valorDevido)} pelo Pix até ${ate} e envie o comprovante ${paraOWhatsapp}. A organização confirma quando receber; sem o pagamento, a vaga volta para a fila.`,
            };
        }
        case 'lista_espera':
            return {
                titulo: 'Você está na lista de espera!',
                texto: whatsapp === null
                    ? 'Quando abrir uma vaga no seu turno, ela vai para o primeiro da fila. Na sua vez, o link abaixo mostra o prazo para pagar. Não pague agora.'
                    : `Quando abrir uma vaga no seu turno, ela vai para o primeiro da fila. Na sua vez, a organização avisa e você paga pelo Pix, com o comprovante ${paraOWhatsapp}. Não pague agora.`,
            };
        default:
            return {
                titulo: 'Inscrição recebida!',
                texto: `Aguardando a conferência do pagamento de ${reais(i.valorDevido)}. Guarde o seu número.`,
            };
    }
}
export default function Enviado({ inscrita, modo, comConvidado, aoNova, comprovantePeloWhatsapp = null, }) {
    const link = linkDeAcompanhamento(inscrita);
    const { titulo, texto } = textos(inscrita, comprovantePeloWhatsapp);
    return (h("section", { className: "grid gap-3", "aria-live": "polite" },
        h(CodigoDaInscricao, { codigo: inscrita.codigo }),
        h("h2", { className: "text-center text-[28px] font-bold leading-tight" }, titulo),
        h("p", { className: "text-[15px] text-texto-suave" }, texto),
        comConvidado && (h("p", { className: "rounded-xl border-2 border-borda bg-superficie px-3 py-2 text-sm" }, "Seu convidado est\u00E1 na lista de espera dos convidados: n\u00E3o pague por ele agora. Se ele for sorteado, a organiza\u00E7\u00E3o avisa.")),
        comprovantePeloWhatsapp === null && (h("div", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Acompanhe sua inscri\u00E7\u00E3o"),
            h("a", { href: link, className: "break-all text-xs font-semibold underline" }, link),
            h(BotaoCopiar, { texto: link, rotulo: "Copiar link", feito: "Link copiado!" }))),
        inscrita.situacao !== 'confirmada' && (h("p", { className: "border-l-4 border-destaque pl-3 text-sm text-texto-suave" }, "O preenchimento n\u00E3o garante a vaga; ela \u00E9 confirmada ap\u00F3s a confer\u00EAncia do pagamento.")),
        modo === 'balcao' && aoNova && (h(BotaoPrincipal, { className: "mt-3", onClick: aoNova }, "Nova inscri\u00E7\u00E3o"))));
}
