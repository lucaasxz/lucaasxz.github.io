import { h, Fragment } from 'preact';
// Passo 6 — o valor, o Pix e o anexo do comprovante, que é OPCIONAL: sem ele a
// vaga fica reservada até o prazo (a data fixa, depois 24 h) e o pagamento entra
// pelo link de acompanhamento.
// Na lista de espera não se paga — a tela explica a fila. No balcão aparece
// "Pago no balcão" (a inscrição já nasce confirmada). A produção (21/10) não
// anexa: paga o Pix e manda o comprovante para o WhatsApp da organização.
import { useState } from 'react';
import { daProducao } from '../../lib/regras.js';
import { prepararComprovante } from '../../lib/comprovante.js';
import { comprovanteFicaDeFora, listaEsperaDoEstado, numeroDoPasso, valorDoEstado } from '../../lib/formulario.js';
import { reais } from '../../lib/formato.js';
import { textoDoPrazo } from '../../lib/prazo.js';
import { BotaoCopiar, Caixa, TituloPasso } from './controles.js';
function tamanho(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
export default function PassoPagamento({ estado, alterar, vagas, modo, }) {
    const [preparando, setPreparando] = useState(false);
    const [erroAnexo, setErroAnexo] = useState(null);
    const valor = valorDoEstado(estado, vagas.precos);
    const naFila = listaEsperaDoEstado(estado, vagas);
    const producao = daProducao(estado.grupoId);
    const numero = numeroDoPasso(6, estado);
    const whatsapp = vagas.whatsapp ? (h(Fragment, null,
        "o WhatsApp ",
        h("b", { className: "whitespace-nowrap text-texto" }, vagas.whatsapp))) : ('o WhatsApp da organização');
    async function escolher(arquivo) {
        if (!arquivo)
            return;
        setPreparando(true);
        setErroAnexo(null);
        const r = await prepararComprovante(arquivo);
        setPreparando(false);
        if (r.ok)
            alterar({ comprovante: r.comprovante });
        else
            setErroAnexo(r.erro);
    }
    if (naFila) {
        return (h("section", { className: "grid gap-3" },
            h(TituloPasso, { numero: numero }, "Lista de espera"),
            h("div", { className: "grid gap-2 rounded-2xl border-2 border-aviso bg-superficie p-4" },
                h("strong", { className: "text-lg leading-tight" }, "Voc\u00EA vai entrar na lista de espera \u2014 n\u00E3o pague agora."),
                producao ? (h("p", { className: "text-sm text-texto-suave" },
                    "Quando abrir uma vaga no seu turno, ela vai para o primeiro da fila. Na sua vez, a organiza\u00E7\u00E3o avisa: voc\u00EA paga",
                    ' ',
                    reais(valor),
                    " pelo Pix e envia o comprovante para ",
                    whatsapp,
                    ".")) : (h("p", { className: "text-sm text-texto-suave" },
                    "Quando abrir uma vaga no seu turno, ela vai para o primeiro da fila. Na sua vez, o link de acompanhamento mostra o prazo para pagar ",
                    reais(valor),
                    " e anexar o comprovante. A organiza\u00E7\u00E3o tamb\u00E9m avisa quem for chamado."))),
            comprovanteFicaDeFora(estado, vagas) && (h("p", { role: "alert", className: "rounded-xl border-2 border-perigo px-3 py-2 text-sm font-semibold text-perigo" },
                "Voc\u00EA j\u00E1 tinha anexado um comprovante, mas agora n\u00E3o h\u00E1 vaga: na lista de espera ele n\u00E3o vai junto. Se voc\u00EA j\u00E1 pagou, fale com a organiza\u00E7\u00E3o",
                vagas.whatsapp ? ` pelo WhatsApp ${vagas.whatsapp}` : '',
                " antes de enviar."))));
    }
    return (h("section", { className: "grid gap-3" },
        h(TituloPasso, { numero: numero }, "Pagamento"),
        h("div", { className: "grid gap-0.5 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-sm text-texto-suave" }, "Valor da sua inscri\u00E7\u00E3o"),
            h("strong", { className: "font-display text-[48px] font-extrabold italic leading-none tabular-nums" }, reais(valor)),
            h("small", { className: "text-[13px] text-texto-suave" }, estado.levaConvidado
                ? `Só a sua parte. O convidado está na lista de espera: se for sorteado, paga ${reais(vagas.precos.convidado)} depois.`
                : 'Colaborador')),
        h("div", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Chave Pix"),
            h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
                h("code", { className: "font-sans text-xl font-semibold" }, vagas.pix.chave),
                h(BotaoCopiar, { texto: vagas.pix.chave, rotulo: "Copiar chave", feito: "Chave copiada!" })),
            h("p", { className: "text-sm text-texto-suave" }, vagas.pix.texto)),
        producao ? (h("div", { className: "grid gap-1.5 rounded-2xl border-2 border-destaque bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Comprovante pelo WhatsApp"),
            h("p", { className: "text-[15px] leading-snug" },
                "Quem \u00E9 da produ\u00E7\u00E3o n\u00E3o anexa aqui: pague o Pix e envie o comprovante para ",
                whatsapp,
                ", ",
                textoDoPrazo(vagas.pagamentoAte),
                "."),
            h("small", { className: "text-sm text-texto-suave" }, "At\u00E9 l\u00E1, a vaga fica reservada. A organiza\u00E7\u00E3o confirma o pagamento quando o comprovante chegar."))) : (h("div", { className: "grid gap-2 rounded-2xl border-2 border-borda bg-superficie p-4" },
            h("span", { className: "text-[13px] font-bold uppercase tracking-wide text-texto-suave" }, "Comprovante do Pix (opcional)"),
            h("small", { className: "text-sm text-texto-suave" },
                "Pagou agora? Anexe o comprovante (imagem ou PDF, at\u00E9 3 MB). Vai pagar depois? Sem o comprovante, a sua vaga fica reservada e voc\u00EA paga ",
                textoDoPrazo(vagas.pagamentoAte),
                ", anexando pelo link de acompanhamento."),
            estado.comprovante ? (h("div", { className: "flex items-center gap-2 rounded-xl bg-trilho px-3 py-2 text-sm" },
                h("span", { "aria-hidden": "true", className: "inline-grid h-6 w-6 place-items-center rounded-full bg-destaque text-xs font-bold text-destaque-texto" }, "\u2713"),
                h("span", { className: "min-w-0 flex-1 truncate" },
                    estado.comprovante.nome,
                    " \u00B7 ",
                    tamanho(estado.comprovante.tamanho)),
                h("button", { type: "button", className: "min-h-11 px-2 underline", onClick: () => alterar({ comprovante: null }) }, "trocar"))) : (h("label", { className: "grid min-h-12 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-borda px-3 py-3 text-center font-semibold" },
                preparando ? 'Preparando o arquivo…' : 'Escolher arquivo ou tirar foto',
                h("input", { type: "file", accept: "image/*,application/pdf,.heic,.heif", className: "sr-only", disabled: preparando, onChange: (e) => {
                        void escolher(e.target.files?.[0]);
                        e.target.value = '';
                    } }))),
            erroAnexo && (h("p", { role: "alert", className: "text-sm font-semibold text-perigo" }, erroAnexo)))),
        modo === 'publico' && vagas.whatsapp && (h("p", { className: "text-sm text-texto-suave" },
            "N\u00E3o conseguiu anexar? Envie pelo WhatsApp ",
            h("b", { className: "whitespace-nowrap text-texto" }, vagas.whatsapp))),
        modo === 'balcao' && (h(Caixa, { marcada: estado.pagoNoBalcao, aoMudar: (pagoNoBalcao) => alterar({ pagoNoBalcao }) }, "Pago no balc\u00E3o (j\u00E1 conferido) \u2014 a inscri\u00E7\u00E3o nasce confirmada."))));
}
