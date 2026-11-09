import { h, Fragment } from 'preact';
// A lista dos turnos, cada um uma RAIA numerada. Só no balcão, para a matrícula
// fora da base (21/10): a mesa escolhe o turno. O esgotado continua escolhível
// (adendo de 20/10): a pessoa segue e entra na lista de espera.
import clsx from 'clsx';
export default function ListaDeTurnos({ vagas, grupoId, aoEscolher, }) {
    return (h("section", null,
        h("p", { className: "text-[15px] text-texto-suave" }, "Escolha o turno em que a pessoa trabalha. As vagas s\u00E3o contadas por turno."),
        h("div", { role: "radiogroup", "aria-label": "Turno", className: "mt-3 border-t-2 border-dashed border-borda" }, vagas.grupos.map((g, i) => {
            const escolhido = g.id === grupoId;
            return (h("button", { key: g.id, type: "button", role: "radio", "aria-checked": escolhido, onClick: () => aoEscolher(g.id), className: clsx('flex min-h-[72px] w-full items-center gap-3 border-b-2 border-dashed border-borda px-1 py-3 text-left', g.esgotado && 'raia-esgotada', escolhido && 'bg-superficie shadow-[inset_6px_0_0_rgb(var(--selecao))]') },
                h("span", { "aria-hidden": "true", className: "numero-raia w-9 flex-none text-4xl font-bold italic" }, i + 1),
                h("span", { className: "flex-1" },
                    h("span", { className: "block font-semibold leading-tight" }, g.nome),
                    g.esgotado && h("span", { className: "mt-1 block text-sm text-texto-suave" }, "Vagas preenchidas: voc\u00EA pode entrar na lista de espera, sem pagar agora.")),
                h("span", { className: "flex-none text-right" }, g.esgotado ? (h("span", { className: "text-sm font-bold" },
                    "Esgotado",
                    h("span", { className: "block text-xs font-semibold text-texto-suave" }, "lista de espera"))) : (h(Fragment, null,
                    h("span", { className: "block text-[28px] font-bold leading-none" }, g.livresColaborador),
                    h("span", { className: "text-xs text-texto-suave" }, g.livresColaborador === 1 ? 'vaga' : 'vagas'))))));
        }))));
}
