import { h, Fragment } from 'preact';
// A abertura da página pública: antes do formulário, um corredor (animação 2D)
// corre enquanto a página carrega (0 a 100%, com recados); em 100% ele levanta o
// troféu e aparece "Começar inscrição". "Pular" vai direto ao formulário. Quem
// pede menos movimento vê o final sem animação; sem canvas, só o texto.
import { useEffect, useRef, useState } from 'react';
import { progressoDaAbertura, recadoDoProgresso } from '../../lib/abertura.js';
import LogoCorrida from '../marca/LogoCorrida.js';
import { ROTULO_LARGADA } from "../../lib/evento.js";
const menosMovimento = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export default function Abertura({ pronto, aoComecar }) {
    const canvas = useRef(null);
    const cena = useRef(null);
    const prontoRef = useRef(pronto);
    const comemorou = useRef(false);
    const botao = useRef(null);
    const [reduzido] = useState(menosMovimento);
    const [pct, setPct] = useState(0);
    const [final, setFinal] = useState(false);
    const [sem3d, setSem3d] = useState(false);
    useEffect(() => {
        prontoRef.current = pronto;
    }, [pronto]);
    // A cena chega à parte; se chegar depois dos 100%, já entra comemorando.
    useEffect(() => {
        let vivo = true;
        import('./cena-corredor.js')
            .then(({ montarCena }) => {
            if (!vivo || !canvas.current)
                return;
            try {
                cena.current = montarCena(canvas.current, { reduzido });
                if (comemorou.current)
                    cena.current.comemorar();
            }
            catch {
                setSem3d(true);
            }
        })
            .catch(() => vivo && setSem3d(true));
        return () => {
            vivo = false;
            cena.current?.destruir();
            cena.current = null;
        };
    }, [reduzido]);
    useEffect(() => {
        const t0 = performance.now();
        let quadro = 0;
        let ultimo = -1;
        let espera;
        const passo = (agora) => {
            const p = reduzido ? (prontoRef.current ? 1 : 0.9) : progressoDaAbertura(agora - t0, prontoRef.current);
            const n = Math.round(p * 100);
            if (n !== ultimo) {
                ultimo = n;
                setPct(n);
            }
            if (p >= 1) {
                comemorou.current = true;
                cena.current?.comemorar();
                espera = setTimeout(() => setFinal(true), reduzido ? 0 : 900);
                return;
            }
            quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
        return () => {
            cancelAnimationFrame(quadro);
            clearTimeout(espera);
        };
    }, [reduzido]);
    useEffect(() => {
        if (final)
            botao.current?.focus();
    }, [final]);
    return (h("div", { role: "dialog", "aria-modal": "true", "aria-label": "Abertura da inscri\u00E7\u00E3o da Corrida 2026", className: "fixed inset-0 z-50 overflow-hidden bg-fundo text-texto", style: { background: 'radial-gradient(120% 70% at 50% 40%, rgb(var(--superficie)), rgb(var(--fundo)) 62%)' } },
        !sem3d && (h("canvas", { ref: canvas, className: "absolute inset-0 h-full w-full", "aria-label": "Animação de um corredor na pista; ao fim do carregamento ele levanta um trof\u00E9u" })),
        h("div", { "aria-hidden": "true", className: "pointer-events-none absolute inset-x-0 bottom-0 h-[52%]", style: { background: 'linear-gradient(transparent, rgb(var(--fundo) / 0.92) 42%)' } }),
        h("div", { className: "relative mx-auto flex h-full max-w-[420px] flex-col justify-between px-6 pb-10 pt-14", style: { paddingBottom: 84 } },
            h("div", { className: "grid justify-items-center gap-1.5 text-center" },
                h(LogoCorrida, { className: "block h-auto w-[190px]" }),
                h("span", { className: "font-display text-[13px] font-bold uppercase tracking-[0.16em] text-texto-suave" }, `Largada · ${ROTULO_LARGADA}`)),
            h("div", { className: "grid gap-3 pt-16" }, !final ? (h(Fragment, null,
                h("p", { className: "flex items-baseline gap-1 font-display text-[92px] font-extrabold italic leading-[0.8] tracking-[-0.03em] tabular-nums" },
                    pct,
                    h("small", { className: "text-[38px] text-destaque" }, "%")),
                h("p", { "aria-live": "polite", className: "min-h-[1.4em] font-display text-xl font-bold uppercase tracking-[0.04em]" }, recadoDoProgresso(pct / 100)),
                h("div", { className: "pista-tracejada relative h-4 rounded-full", "aria-hidden": "true" },
                    h("span", { className: "absolute inset-y-0 left-0 rounded-full bg-destaque", style: { width: `${pct}%` } },
                        h("span", { className: "absolute -right-[9px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-destaque ring-4 ring-fundo" })),
                    h("span", { className: "linha-chegada absolute -bottom-1.5 -right-0.5 -top-1.5 w-2.5 rounded-sm" })),
                h("div", { className: "flex min-h-[52px] items-center justify-between gap-3" },
                    h("span", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, "6 km corrida \u00B7 4 km caminhada"),
                    h("button", { type: "button", onClick: aoComecar, className: "min-h-11 px-1 font-semibold text-texto-suave underline" }, "Pular")))) : (h("div", { className: "grid gap-3" },
                h("h2", { className: "font-display text-[46px] font-extrabold uppercase italic leading-[0.92] tracking-[-0.01em]" },
                    "Pronto para ",
                    h("em", { className: "text-ouro" }, "a largada!")),
                h("p", { className: "text-texto-suave" }, "As vagas s\u00E3o contadas por turno. Garanta a sua."),
                h("button", { ref: botao, type: "button", onClick: aoComecar, className: "mt-1 min-h-[54px] w-full -skew-x-6 rounded-[14px] bg-cta px-5 font-display text-[21px] font-extrabold uppercase italic text-cta-texto" },
                    h("span", { className: "inline-block skew-x-6" }, "Come\u00E7ar inscri\u00E7\u00E3o \u2192"))))))));
}
