import { h, Fragment } from 'preact';
// As linhas curvas dos cantos dos cartazes (decorativas).
export default function CurvasDeCanto({ className = '' }) {
    return (h("svg", { viewBox: "0 0 200 160", "aria-hidden": "true", className: `pointer-events-none ${className}` },
        h("g", { fill: "none", strokeWidth: "2" },
            h("path", { d: "M10 0 C70 60 140 40 200 120", stroke: "rgb(var(--texto) / 0.45)" }),
            h("path", { d: "M40 0 C90 50 150 30 200 90", stroke: "rgb(var(--destaque))" }),
            h("path", { d: "M80 0 C120 40 170 20 200 60", stroke: "rgb(var(--texto) / 0.45)" }))));
}
