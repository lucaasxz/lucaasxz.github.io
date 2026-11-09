import { h, Fragment } from 'preact';
// O progresso como os pontos de controle da pista (adendo 5): a etapa atual em
// lima, as feitas cheias, as próximas vazadas, ligadas pela linha tracejada.
import clsx from 'clsx';
const ROTULOS = { 1: 'Matrícula', 2: 'Dados', 3: 'Prova', 4: 'Convidado', 5: 'Termo', 6: 'Pagamento', 7: '' };
/** passos: os que a pessoa percorre (a produção, no balcão, não passa pelo termo). */
export default function BarraDeProgresso({ passo, passos }) {
    const atual = passos.indexOf(passo);
    return (h("ol", { "aria-label": "Etapas da inscri\u00E7\u00E3o", className: clsx('relative mt-4 grid', passos.length === 5 ? 'grid-cols-5' : 'grid-cols-6') },
        h("span", { "aria-hidden": "true", className: "pista-tracejada absolute left-[8%] right-[8%] top-[9px] h-0.5" }),
        passos.map((p, i) => {
            const rotulo = ROTULOS[p];
            return (h("li", { key: p, "aria-current": i === atual ? 'step' : undefined, className: clsx('relative grid justify-items-center gap-1.5 text-center text-[11px] font-semibold', i === atual ? 'text-texto' : 'text-texto-suave') },
                h("span", { "aria-hidden": "true", className: clsx('rounded-full border-2', i === atual && 'h-5 w-5 border-destaque bg-destaque shadow-[0_0_0_5px_rgb(var(--destaque)/0.25)]', i < atual && 'mt-1 h-3 w-3 border-destaque bg-destaque', i > atual && 'mt-1 h-3 w-3 border-borda bg-fundo') }),
                rotulo));
        })));
}
