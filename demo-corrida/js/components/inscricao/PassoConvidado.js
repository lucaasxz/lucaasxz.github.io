import { h, Fragment } from 'preact';
// Passo 4 — o convidado (no máximo 1). Ele vai para a lista de espera dos
// convidados: não ocupa vaga nem paga agora; entra pelo sorteio (adendo 4).
// Depois dele, as crianças: só a quantidade, para as brincadeiras (adendo 7).
import { MAX_CRIANCAS, validarNome } from '../../lib/regras.js';
import { reais } from '../../lib/formato.js';
import { Campo, Contador, Opcoes, TituloPasso } from './controles.js';
import { EscolhaCamiseta, EscolhaModalidade } from './PassoProva.js';
export default function PassoConvidado({ estado, alterar, vagas, }) {
    const c = estado.convidado;
    const mudar = (parcial) => alterar({ convidado: { ...c, ...parcial } });
    return (h("section", { className: "grid gap-4" },
        h(TituloPasso, { numero: 4 }, "Convidado e crian\u00E7as"),
        h(Opcoes, { rotulo: "Vai levar convidado? (m\u00E1ximo 1)", opcoes: [
                { valor: 'nao', rotulo: 'Não' },
                { valor: 'sim', rotulo: 'Sim, 1 convidado' },
            ], valor: estado.levaConvidado ? 'sim' : 'nao', aoEscolher: (v) => alterar({ levaConvidado: v === 'sim' }) }),
        h("p", { className: "rounded-xl border-2 border-borda bg-superficie px-3 py-2 text-sm" },
            "As vagas s\u00E3o dos colaboradores. O seu convidado entra na ",
            h("b", null, "lista de espera dos convidados"),
            " e n\u00E3o paga agora. Se sobrar ou abrir vaga, a organiza\u00E7\u00E3o sorteia entre os convidados e avisa voc\u00EA; a\u00ED s\u00E3o ",
            reais(vagas.precos.convidado),
            " pelo convidado."),
        estado.levaConvidado && (h("div", { className: "grid gap-4" },
            h(Campo, { rotulo: "Nome completo do convidado", dica: "Sem apelido.", value: c.nome, onChange: (e) => mudar({ nome: e.target.value }), erro: c.nome.trim() && validarNome(c.nome) ? validarNome(c.nome) : null }),
            h(EscolhaModalidade, { rotulo: "Modalidade do convidado", valor: c.modalidade, aoEscolher: (modalidade) => mudar({ modalidade }) }),
            h(EscolhaCamiseta, { rotulo: "Camiseta do convidado", valor: c.camiseta, aoEscolher: (camiseta) => mudar({ camiseta }) }))),
        h("div", { className: "grid gap-4 border-t-2 border-dashed border-borda pt-4" },
            h(Opcoes, { rotulo: "Vai levar crian\u00E7a?", opcoes: [
                    { valor: 'nao', rotulo: 'Não' },
                    { valor: 'sim', rotulo: 'Sim' },
                ], valor: estado.levaCriancas === null ? '' : estado.levaCriancas ? 'sim' : 'nao', aoEscolher: (v) => alterar({ levaCriancas: v === 'sim' }) }),
            h("p", { className: "text-sm text-texto-suave" }, "As crian\u00E7as n\u00E3o correm: elas participam das brincadeiras preparadas para elas. S\u00F3 precisamos saber quantas v\u00E3o."),
            estado.levaCriancas && (h(Contador, { rotulo: "Quantas crian\u00E7as?", valor: estado.criancas, min: 1, max: MAX_CRIANCAS, aoMudar: (criancas) => alterar({ criancas }) })))));
}
