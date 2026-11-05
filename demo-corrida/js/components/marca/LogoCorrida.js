import { h, Fragment } from 'preact';
// A marca neutra da demonstração: "corrida" com o selo 2026 e as três faixas
// da pista. A cor vem do token --logo; as faixas, de --faixa.
export default function LogoCorrida({ className = '' }) {
    return (h("svg", { viewBox: "0 0 230 70", role: "img", "aria-label": "Corrida 2026", className: `text-logo ${className}` },
        h("text", { x: "0", y: "46", fontFamily: "Barlow, Inter, sans-serif", fontWeight: "700", fontSize: "46", letterSpacing: "-1.5", fill: "currentColor", textLength: "178", lengthAdjust: "spacingAndGlyphs" },
            "corr",
            h("tspan", { fontStyle: "italic" }, "ida")),
        h("text", { x: "186", y: "13", fontFamily: "Barlow, Inter, sans-serif", fontWeight: "700", fontSize: "14", fill: "currentColor" }, "2026"),
        h("g", { fill: "none", stroke: "rgb(var(--faixa))", strokeWidth: "3.2", strokeLinecap: "round" },
            h("path", { d: "M104 55 C140 63 182 60 216 40" }),
            h("path", { d: "M110 61 C146 69 188 66 222 46" }),
            h("path", { d: "M116 67 C152 74 194 71 228 52" }))));
}
