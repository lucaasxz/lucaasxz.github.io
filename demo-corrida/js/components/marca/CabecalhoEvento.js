import { h, Fragment } from 'preact';
// O topo da página pública: a logo, as curvas do cartaz e, à direita, quantos
// dias faltam para a largada (adendo 5).
import { diasParaLargada } from '../../lib/evento.js';
import CurvasDeCanto from './CurvasDeCanto.js';
import LogoCorrida from './LogoCorrida.js';
export default function CabecalhoEvento({ chamada = 'Inscrições abertas' }) {
    const dias = diasParaLargada();
    return (h("header", { className: "relative flex items-start justify-between gap-3 px-4 pb-2 pt-6" },
        h(CurvasDeCanto, { className: "pointer-events-none absolute -right-5 -top-2 h-[140px] w-[170px]" }),
        h(LogoCorrida, { className: "relative block h-auto w-[170px]" }),
        h("p", { className: "relative mt-1 text-right text-xs leading-tight text-texto-suave" },
            chamada && h("span", { className: "block" }, chamada),
            dias > 0 ? (h(Fragment, null,
                h("b", { className: "block font-display text-[24px] font-extrabold italic leading-none text-texto" },
                    dias,
                    " ",
                    dias === 1 ? 'dia' : 'dias'),
                "para a largada")) : (h("b", { className: "block font-display text-[22px] font-extrabold italic leading-none text-texto" }, "Dia de corrida!")))));
}
