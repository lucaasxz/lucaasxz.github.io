import { h, Fragment } from 'preact';
// Os controles do formulário. Só tokens de cor: o mesmo componente serve à
// página pública (marca do evento) e ao balcão (mesma identidade).
import clsx from 'clsx';
import { useContext, useId, useState } from 'react';
import { TotalDeEtapas } from './total-de-etapas.js';
export function Campo({ rotulo, dica, erro, id, className, ...resto }) {
    const gerado = useId();
    const idCampo = id ?? gerado;
    const descricao = [dica && `${idCampo}-dica`, erro && `${idCampo}-erro`].filter(Boolean).join(' ') || undefined;
    return (h("div", { className: clsx('grid gap-1', className) },
        h("label", { htmlFor: idCampo, className: "text-[13px] font-bold uppercase tracking-[0.08em] text-texto-suave" }, rotulo),
        dica && (h("p", { id: `${idCampo}-dica`, className: "text-sm text-texto-suave" }, dica)),
        h("input", { id: idCampo, "aria-invalid": erro ? true : undefined, "aria-describedby": descricao, className: clsx('min-h-12 rounded-xl border-2 bg-superficie px-3 text-base font-semibold text-texto outline-none placeholder:font-medium placeholder:text-texto-suave', erro ? 'border-perigo' : 'border-borda focus:border-selecao'), ...resto }),
        erro && (h("p", { id: `${idCampo}-erro`, className: "text-sm font-semibold text-perigo" }, erro))));
}
export function Opcoes({ rotulo, opcoes, valor, aoEscolher, desabilitado = false, }) {
    return (h("fieldset", { disabled: desabilitado, className: "grid gap-2 disabled:opacity-60" },
        h("legend", { className: "mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-texto-suave" }, rotulo),
        h("div", { className: "flex flex-wrap gap-2" }, opcoes.map((o) => (h("button", { key: o.valor, type: "button", "aria-pressed": valor === o.valor, onClick: () => aoEscolher(o.valor), className: clsx('min-h-12 min-w-12 rounded-xl border-2 px-4 font-semibold transition-colors', valor === o.valor ? 'border-cta bg-cta text-cta-texto' : 'border-borda bg-superficie text-texto') }, o.rotulo))))));
}
/** − n +: uma quantidade pequena sem teclado (adendo 7, as crianças). */
export function Contador({ rotulo, valor, min, max, aoMudar, }) {
    const botao = 'h-12 w-12 rounded-xl border-2 border-borda bg-superficie text-2xl font-bold text-texto disabled:opacity-40';
    return (h("fieldset", { className: "grid gap-2" },
        h("legend", { className: "mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-texto-suave" }, rotulo),
        h("div", { className: "flex items-center gap-3" },
            h("button", { type: "button", className: botao, "aria-label": "Uma a menos", disabled: valor <= min, onClick: () => aoMudar(valor - 1) }, "\u2212"),
            h("output", { "aria-live": "polite", className: "min-w-12 text-center font-display text-4xl font-bold italic text-destaque" }, valor),
            h("button", { type: "button", className: botao, "aria-label": "Uma a mais", disabled: valor >= max, onClick: () => aoMudar(valor + 1) }, "+"))));
}
export function Caixa({ marcada, aoMudar, children }) {
    return (h("label", { className: "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 border-borda bg-superficie p-3" },
        h("input", { type: "checkbox", checked: marcada, onChange: (e) => aoMudar(e.target.checked), className: "mt-0.5 h-5 w-5 flex-none [accent-color:rgb(var(--cta))]" }),
        h("span", { className: "text-sm leading-snug" }, children)));
}
export function BotaoCopiar({ texto, rotulo, feito = 'Copiado!' }) {
    const [copiado, setCopiado] = useState(false);
    async function copiar() {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        }
        catch {
            // Sem permissão de área de transferência: o texto continua na tela para copiar à mão.
        }
    }
    return (h("button", { type: "button", onClick: copiar, className: "min-h-11 flex-none rounded-full border-2 border-destaque px-4 text-sm font-bold text-texto" },
        h("span", { "aria-live": "polite" }, copiado ? feito : rotulo)));
}
/** O botão da pista: inclinado, itálico condensado; o texto volta reto. */
export function BotaoPrincipal({ className, children, ...resto }) {
    return (h("button", { type: "button", className: clsx('min-h-[54px] w-full -skew-x-6 rounded-[14px] bg-cta px-5 font-display text-[21px] font-extrabold uppercase italic tracking-[0.02em] text-cta-texto disabled:opacity-60', className), ...resto },
        h("span", { className: "inline-block skew-x-6" }, children)));
}
/** O título de cada etapa: a etapa em cima, a pergunta grande em itálico condensado. */
export function TituloPasso({ numero, children }) {
    const total = useContext(TotalDeEtapas);
    return (h("h2", { className: "mb-2 mt-6 grid gap-1" },
        h("span", { className: "text-[13px] font-bold uppercase tracking-[0.14em] text-texto-suave" },
            "Etapa ",
            numero,
            " de ",
            total),
        h("span", { className: "font-display text-[40px] font-extrabold uppercase italic leading-[0.92] tracking-[-0.01em] [text-wrap:balance]" }, children)));
}
/** O código da inscrição em texto simples (adendo 3: sem número de peito na
 *  tela — o número da corrida não é este). A mesa acha a inscrição por ele. */
export function CodigoDaInscricao({ codigo }) {
    return (h("p", { className: "mt-5 grid justify-items-center gap-0.5 text-center" },
        h("span", { className: "text-[13px] font-bold uppercase tracking-[0.14em] text-texto-suave" }, "Inscri\u00E7\u00E3o n\u00BA"),
        h("strong", { className: "font-display text-[64px] font-extrabold italic leading-none tabular-nums" }, codigo)));
}
