import { h, Fragment } from 'preact';
// Passo 3 — a prova. A camiseta é só do convidado (adendo 3): a escolha de
// tamanho mora aqui e o passo do convidado a usa.
import { CAMISETAS, MODALIDADES } from '../../lib/regras.js';
import { Opcoes, TituloPasso } from './controles.js';
const OPCOES_MODALIDADE = Object.keys(MODALIDADES).map((m) => ({ valor: m, rotulo: MODALIDADES[m] }));
const OPCOES_CAMISETA = CAMISETAS.map((c) => ({ valor: c, rotulo: c }));
export function EscolhaModalidade(p) {
    return h(Opcoes, { rotulo: p.rotulo ?? 'Modalidade', opcoes: OPCOES_MODALIDADE, valor: p.valor, aoEscolher: p.aoEscolher });
}
export function EscolhaCamiseta(p) {
    return h(Opcoes, { rotulo: p.rotulo ?? 'Tamanho da camiseta', opcoes: OPCOES_CAMISETA, valor: p.valor, aoEscolher: p.aoEscolher });
}
export default function PassoProva({ estado, alterar, }) {
    return (h("section", { className: "grid gap-5" },
        h(TituloPasso, { numero: 3 }, "Sua prova"),
        h(EscolhaModalidade, { valor: estado.modalidade, aoEscolher: (modalidade) => alterar({ modalidade }) }),
        h("p", { className: "text-sm text-texto-suave" }, "Inclui o kit do participante.")));
}
