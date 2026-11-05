import { h, Fragment } from 'preact';
// Um turno como uma raia da pista (adendo 5): o número em contorno, as vagas
// confirmadas (lima), em andamento (lima hachurado), dos convidados sorteados
// (azul) e as livres (tracejado), até a linha de chegada quadriculada.
import { percentual } from '../../lib/api-org.js';
import { Etiqueta } from './ui.js';
export default function RaiaDeOcupacao({ numero, nome, cota, confirmadas, andamento, convidados, fila, }) {
    const ocupadas = confirmadas + andamento + convidados;
    const livres = Math.max(0, cota - ocupadas);
    const largura = (n) => `${Math.min(100, percentual(n, cota))}%`;
    return (h("div", { className: "grid grid-cols-[34px_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[34px_220px_minmax(0,1fr)_96px_150px]" },
        h("span", { "aria-hidden": "true", className: "numero-raia text-center font-display text-3xl font-extrabold italic" }, numero),
        h("span", { className: "min-w-0 font-bold leading-tight" },
            nome,
            h("small", { className: "block font-medium text-texto-suave" },
                cota,
                " vagas")),
        h("span", { className: "text-right font-display text-[26px] font-extrabold italic tabular-nums md:col-start-4 md:row-start-1" },
            ocupadas,
            h("small", { className: "text-base font-semibold not-italic text-texto-suave" },
                "/",
                cota)),
        h("span", { className: "md:col-start-5 md:row-start-1" }, livres === 0 ? (h(Etiqueta, { tom: "perigo" },
            "esgotado",
            fila ? ` · ${fila} na fila` : '')) : (h(Etiqueta, null,
            livres,
            " livres"))),
        h("div", { role: "meter", "aria-label": `${nome}: ${confirmadas} confirmadas, ${andamento} em andamento, ${convidados} convidados, de ${cota}`, "aria-valuemin": 0, "aria-valuemax": cota, "aria-valuenow": ocupadas, className: "trilho-livre relative col-span-4 flex h-5 overflow-hidden rounded-md md:col-span-1 md:col-start-3 md:row-start-1" },
            h("i", { className: "bg-destaque", style: { width: largura(confirmadas) } }),
            h("i", { className: "faixa-andamento", style: { width: largura(andamento) } }),
            h("i", { className: "bg-faixa", style: { width: largura(convidados) } }),
            h("span", { className: "linha-chegada absolute inset-y-0 right-0 w-2.5" }))));
}
