import { h, Fragment } from 'preact';
// Passo 2 — os dados do colaborador. Nome e matrícula vieram da base no passo 1
// (adendo 2; no balcão também, desde 21/10). Só a matrícula fora da base, no
// balcão, digita o nome aqui — e a regra do nome avisa assim que a pessoa sai do
// campo (a mesma função do servidor).
import { useState } from 'react';
import { ERRO_CAMPO, LIMITE_SETOR, telefoneValido, validarNome } from '../../lib/regras.js';
import { mascaraTelefone } from '../../lib/formato.js';
import { Campo, TituloPasso } from './controles.js';
export default function PassoDados({ estado, alterar, modo }) {
    const [tocados, setTocados] = useState({});
    const tocar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));
    const se = (campo, erro) => (tocados[campo] ? erro : null);
    return (h("section", { className: "grid gap-4" },
        h(TituloPasso, { numero: 2 }, "Seus dados"),
        modo === 'balcao' && estado.semBase ? (h(Campo, { rotulo: "Nome completo", autoComplete: "name", value: estado.nome, onChange: (e) => alterar({ nome: e.target.value }), onBlur: tocar('nome'), erro: se('nome', validarNome(estado.nome)) })) : (h("p", { className: "text-[15px] text-texto-suave" },
            estado.nome,
            " \u00B7 matr\u00EDcula ",
            estado.matricula,
            estado.setorDaBase && ` · ${estado.setor}`)),
        !estado.setorDaBase && (h(Campo, { rotulo: "Setor", autoComplete: "organization-title", value: estado.setor, onChange: (e) => alterar({ setor: e.target.value }), onBlur: tocar('setor'), erro: se('setor', estado.setor.trim().length >= LIMITE_SETOR.min ? null : ERRO_CAMPO.setor) })),
        h(Campo, { rotulo: "Telefone / WhatsApp", type: "tel", inputMode: "tel", autoComplete: "tel-national", placeholder: "(11) 99999-9999", value: estado.telefone, onChange: (e) => alterar({ telefone: mascaraTelefone(e.target.value) }), onBlur: tocar('telefone'), erro: se('telefone', telefoneValido(estado.telefone) ? null : ERRO_CAMPO.telefone) }),
        h("fieldset", { className: "grid gap-3 rounded-xl border-2 border-dashed border-borda p-3" },
            h("legend", { className: "px-1 font-semibold" }, "Contato de emerg\u00EAncia"),
            h(Campo, { rotulo: "Nome", value: estado.emergenciaNome, onChange: (e) => alterar({ emergenciaNome: e.target.value }) }),
            h(Campo, { rotulo: "Telefone", type: "tel", inputMode: "tel", placeholder: "(11) 99999-9999", value: estado.emergenciaTel, onChange: (e) => alterar({ emergenciaTel: mascaraTelefone(e.target.value) }) }))));
}
