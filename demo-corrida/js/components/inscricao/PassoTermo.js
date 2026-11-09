import { h, Fragment } from 'preact';
import { TERMO_IMAGEM, TERMO_LGPD, TERMO_RESP_CONV, TERMO_RESP_MENOR, TERMO_SAUDE, linhaEncarregado } from '../../lib/termos.js';
import { Caixa, Opcoes, TituloPasso } from './controles.js';
export default function PassoTermo({ estado, alterar, canalEncarregado, }) {
    const imagem = estado.autorizaImagem === null ? '' : estado.autorizaImagem ? 'sim' : 'nao';
    return (h("section", { className: "grid gap-3" },
        h(TituloPasso, { numero: 5 }, "Termo"),
        h(Caixa, { marcada: estado.aceiteSaude, aoMudar: (aceiteSaude) => alterar({ aceiteSaude }) }, TERMO_SAUDE),
        estado.levaConvidado && (h(Caixa, { marcada: estado.aceiteRespConv, aoMudar: (aceiteRespConv) => alterar({ aceiteRespConv }) },
            TERMO_RESP_CONV,
            h("span", { className: "mt-1 block" }, TERMO_RESP_MENOR))),
        h(Caixa, { marcada: estado.aceiteLgpd, aoMudar: (aceiteLgpd) => alterar({ aceiteLgpd }) },
            TERMO_LGPD,
            " ",
            h("span", { className: "text-texto-suave" }, linhaEncarregado(canalEncarregado))),
        h("div", { className: "mt-2 grid gap-2" },
            h("p", { className: "text-sm" }, TERMO_IMAGEM),
            h(Opcoes, { rotulo: "Autoriza o uso de imagem?", opcoes: [
                    { valor: 'sim', rotulo: 'Sim, autorizo' },
                    { valor: 'nao', rotulo: 'Não autorizo' },
                ], valor: imagem, aoEscolher: (v) => alterar({ autorizaImagem: v === 'sim' }) }))));
}
