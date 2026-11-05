import { h, Fragment } from 'preact';
// Peças da mesa da organização — a mesma identidade da página pública (adendo
// 5): a pista do cartaz, títulos em itálico condensado, o lima no que pede ação.
import clsx from 'clsx';
import { rotuloSituacao } from '../../lib/api-org.js';
export function Cartao({ titulo, acao, children, className }) {
    return (h("section", { className: clsx('min-w-0 rounded-[18px] bg-superficie p-5', className) },
        (titulo || acao) && (h("header", { className: "mb-3 flex flex-wrap items-baseline justify-between gap-2" },
            titulo && h("h2", { className: "font-display text-2xl font-extrabold uppercase tracking-[0.01em]" }, titulo),
            acao)),
        children));
}
export function Botao({ variante = 'secundario', className, ...resto }) {
    return (h("button", { type: "button", className: clsx('min-h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-50', variante === 'primario' && 'bg-cta text-cta-texto', variante === 'secundario' && 'border-2 border-borda bg-superficie-2 text-texto', variante === 'perigo' && 'border-2 border-perigo bg-superficie text-perigo', className), ...resto }));
}
const COR = {
    pendente: 'border-aviso text-aviso',
    confirmada: 'border-sucesso text-sucesso',
    aguardando_pagamento: 'border-faixa text-faixa',
    lista_espera: 'border-texto-suave text-texto-suave',
    recusada: 'border-perigo text-perigo',
    cancelada: 'border-borda text-texto-suave',
    expirada: 'border-borda text-texto-suave',
};
export function SeloSituacao({ situacao }) {
    return (h("span", { className: clsx('inline-block whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-xs font-bold', COR[situacao]) }, rotuloSituacao(situacao)));
}
/** Uma etiqueta curta de estado: o que vence (alerta), o que acabou (perigo). */
export function Etiqueta({ tom = 'contorno', children }) {
    return (h("span", { className: clsx('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold', tom === 'contorno' && 'border border-borda text-texto-suave', tom === 'alerta' && 'bg-alerta text-alerta-texto', tom === 'perigo' && 'bg-perigo text-fundo') }, children));
}
/** Um número do placar. "chama" = pede ação agora (fundo lima). */
export function Numero({ rotulo, valor, detalhe, chama = false }) {
    return (h("div", { className: clsx('grid h-full content-start gap-1 rounded-2xl p-4', chama ? 'bg-destaque text-destaque-texto' : 'bg-superficie') },
        h("p", { className: clsx('text-xs font-bold uppercase tracking-[0.1em]', !chama && 'text-texto-suave') }, rotulo),
        h("p", { className: "font-display text-[42px] font-extrabold italic leading-[0.95] tracking-[-0.01em] tabular-nums" }, valor),
        detalhe && h("div", { className: clsx('text-[13px]', !chama && 'text-texto-suave') }, detalhe)));
}
export function Aviso({ children, tom = 'perigo' }) {
    return (h("p", { role: "alert", className: clsx('rounded-xl border-2 px-3 py-2 text-sm font-semibold', tom === 'perigo' ? 'border-perigo text-perigo' : 'border-sucesso text-sucesso') }, children));
}
