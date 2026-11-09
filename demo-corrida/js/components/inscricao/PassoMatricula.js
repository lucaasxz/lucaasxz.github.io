import { h, Fragment } from 'preact';
// Passo 1 (adendo 2) — a matrícula. A busca na base de colaboradores traz o
// nome, o turno e o setor: o turno deixa de ser escolha, então ninguém do turno
// esgotado se inscreve pelo turno com vaga. Trocar a matrícula apaga o que a
// busca trouxe. A página é do Administrativo: a produção se inscreve com o admin
// da corrida (21/10). No balcão, a mesa busca pela rota dela (inclusive a
// produção); fora da base, segue escolhendo o turno (semBase).
// Visual do adendo 5: a matrícula grande como um chip de cronometragem e o
// cartão com o medidor das vagas do turno.
import { useState } from 'react';
import { ERRO_CAMPO, RECUSA, matriculaValida } from '../../lib/regras.js';
import { buscarColaboradorNaMesa } from '../../lib/api-org.js';
import { buscarColaborador } from '../../lib/api-publica.js';
import { TituloPasso } from './controles.js';
import ListaDeTurnos from './ListaDeTurnos.js';
import { MATRICULAS_DEMO } from '../../lib/demo/semente.js';
/** Demonstração: matrículas fictícias para testar cada caminho (toque preenche). */
function DicaDemo({ aoEscolher }) {
    return (h("div", { className: "demo-dica" },
        h("b", null, "Demonstração · matrículas fictícias"),
        h("ul", null, MATRICULAS_DEMO.map((m) => (h("li", { key: m.matricula },
            h("button", { type: "button", onClick: () => aoEscolher(m.matricula) }, m.matricula),
            h("span", null, m.rotulo)))))));
}
export default function PassoMatricula({ estado, alterar, vagas, modo, }) {
    const balcao = modo === 'balcao';
    const [buscando, setBuscando] = useState(false);
    const [erro, setErro] = useState(null);
    const [foraDaBase, setForaDaBase] = useState(false);
    const [jaInscrita, setJaInscrita] = useState(false);
    const semBase = balcao && estado.semBase;
    const conferida = !semBase && estado.nome !== '' && estado.grupoId !== '';
    const grupo = vagas.grupos.find((g) => g.id === estado.grupoId);
    const comOrganizacao = vagas.whatsapp ? ` pelo WhatsApp ${vagas.whatsapp}` : '';
    // O medidor enche com as vagas LIVRES (como na maquete): cheio = muita vaga.
    const livres = grupo && grupo.vagas > 0 ? Math.round((grupo.livresColaborador / grupo.vagas) * 100) : 0;
    async function buscar(ev) {
        ev.preventDefault();
        if (!matriculaValida(estado.matricula)) {
            setErro(ERRO_CAMPO.matricula);
            return;
        }
        setBuscando(true);
        setErro(null);
        setForaDaBase(false);
        setJaInscrita(false);
        const r = await (balcao ? buscarColaboradorNaMesa : buscarColaborador)(estado.matricula);
        setBuscando(false);
        if (r.ok) {
            const { nome, grupoId, setor } = r.colaborador;
            alterar(setor ? { nome, grupoId, setor, setorDaBase: true } : { nome, grupoId, ...(estado.setorDaBase ? { setor: '', setorDaBase: false } : {}) });
        }
        else {
            setErro(r.erro);
            setForaDaBase(r.foraDaBase);
            setJaInscrita(r.jaInscrita);
        }
    }
    return (h("section", null,
        balcao ? (h(Fragment, null,
            h(TituloPasso, { numero: 1 }, "Matr\u00EDcula do colaborador"),
            h("p", { className: "text-[15px] text-texto-suave" }, "Digite a matr\u00EDcula: o nome, o turno e o setor v\u00EAm do cadastro."))) : (h(Fragment, null,
            h(TituloPasso, { numero: 1 }, "Qual \u00E9 a sua matr\u00EDcula?"),
            h("p", { className: "text-[15px] text-texto-suave" }, "Seu nome, turno e setor v\u00EAm do cadastro. Voc\u00EA n\u00E3o escolhe o turno."),
            h("p", { className: "mt-2 border-l-4 border-destaque pl-3 text-sm text-texto-suave" }, "Esta p\u00E1gina \u00E9 do Administrativo e do Comercial. Quem \u00E9 da produ\u00E7\u00E3o (Turnos A, B e C) se inscreve com o admin da corrida."))),
        h(DicaDemo, { aoEscolher: (matricula) => {
                alterar({ matricula, nome: '', grupoId: '', semBase: false, ...(estado.setorDaBase ? { setor: '', setorDaBase: false } : {}) });
                setErro(null);
                setForaDaBase(false);
                setJaInscrita(false);
            } }),
        h("form", { onSubmit: (ev) => void buscar(ev), className: "mt-4 grid gap-1.5" },
            h("label", { htmlFor: "matricula", className: "text-[13px] font-bold uppercase tracking-[0.08em] text-texto-suave" }, "Matr\u00EDcula"),
            h("div", { className: "flex overflow-hidden rounded-2xl border-2 border-borda bg-superficie-2 focus-within:border-selecao" },
                h("input", { id: "matricula", className: "min-w-0 flex-1 bg-transparent px-4 py-2.5 font-display text-[34px] font-bold tracking-[0.12em] tabular-nums text-texto outline-none", inputMode: "numeric", autoComplete: "off", enterKeyHint: "search", value: estado.matricula, readOnly: buscando, "aria-invalid": erro ? true : undefined, "aria-describedby": erro ? 'matricula-erro' : undefined, onChange: (e) => {
                        alterar({
                            matricula: e.target.value.replace(/\D/g, '').slice(0, 10),
                            nome: '',
                            grupoId: '',
                            semBase: false,
                            ...(estado.setorDaBase ? { setor: '', setorDaBase: false } : {}),
                        });
                        setErro(null);
                        setForaDaBase(false);
                        setJaInscrita(false);
                    } }),
                h("button", { type: "submit", disabled: buscando, className: "flex-none bg-trilho px-5 font-bold text-texto disabled:opacity-60" }, buscando ? 'Buscando…' : 'Buscar'))),
        erro && !semBase && (h("div", { id: "matricula-erro", role: "alert", className: "mt-3 grid gap-2 rounded-xl border-2 border-alerta px-3 py-2 text-sm font-semibold" },
            h("p", null,
                erro,
                !balcao && foraDaBase && comOrganizacao && ` WhatsApp da organização: ${vagas.whatsapp}.`,
                !balcao && jaInscrita && ' Se foi neste aparelho, o link "Acompanhar" fica no topo da página.',
                !balcao && jaInscrita && comOrganizacao && ` Organização: WhatsApp ${vagas.whatsapp}.`),
            balcao && foraDaBase && (h("button", { type: "button", className: "min-h-11 justify-self-start rounded-xl border-2 border-borda px-4 font-semibold text-texto", onClick: () => {
                    alterar({ semBase: true, nome: '', grupoId: '' });
                    setErro(null);
                } }, "Seguir escolhendo o turno")))),
        semBase && (h("div", { className: "mt-4 grid gap-1" },
            h("p", { className: "border-l-4 border-aviso pl-3 text-sm font-semibold" }, "Matr\u00EDcula fora da base: escolha o turno; o nome completo \u00E9 digitado no pr\u00F3ximo passo."),
            h(ListaDeTurnos, { vagas: vagas, grupoId: estado.grupoId, aoEscolher: (grupoId) => alterar({ grupoId }) }))),
        conferida && (h("div", { "aria-live": "polite", className: "mt-4 grid gap-3 rounded-2xl border border-borda bg-superficie p-4" },
            h("div", { className: "grid gap-0.5" },
                h("span", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, "Nome completo"),
                h("strong", { className: "text-[22px] font-bold leading-tight [text-wrap:balance]" }, estado.nome)),
            h("div", { className: "grid grid-cols-2 gap-2.5" },
                h("div", { className: "grid min-w-0 gap-0.5 rounded-xl bg-fundo px-3 py-2.5" },
                    h("span", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, "Turno"),
                    h("b", { className: "leading-tight" }, grupo?.nome ?? '—')),
                h("div", { className: "grid min-w-0 gap-0.5 rounded-xl bg-fundo px-3 py-2.5" },
                    h("span", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, "Setor"),
                    h("b", { className: "leading-tight" }, estado.setorDaBase ? estado.setor : balcao ? 'informe a seguir' : 'você informa a seguir'))),
            grupo ? (h("div", { className: "grid gap-1.5" },
                h("div", { className: "trilho-livre h-2.5 overflow-hidden rounded-full", "aria-hidden": "true" },
                    h("i", { className: "block h-full rounded-full bg-destaque", style: { width: `${livres}%` } })),
                h("p", { className: "text-sm" }, grupo.esgotado ? ('Vagas preenchidas: você pode seguir e entrar na lista de espera, sem pagar agora.') : (h(Fragment, null,
                    h("b", { className: "font-display text-[22px] font-extrabold italic" }, grupo.livresColaborador),
                    " de ",
                    grupo.vagas,
                    ' ',
                    grupo.livresColaborador === 1 ? 'vaga livre' : 'vagas livres',
                    " no seu turno"))))) : (h("p", { className: "font-semibold text-perigo" }, RECUSA.grupoFechado)),
            h("p", { className: "text-[13px] text-texto-suave" }, balcao
                ? 'Confira com a pessoa o nome, o turno e o setor antes de seguir.'
                : `Não é você, ou o turno está errado? Fale com a organização${comOrganizacao} antes de seguir.`)))));
}
