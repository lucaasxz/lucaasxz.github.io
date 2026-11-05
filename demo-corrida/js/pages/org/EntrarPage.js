import { h, Fragment } from 'preact';
// /org/entrar — login da mesa da organização. Na demonstração, o login vem
// preenchido e qualquer senha entra (não há conta real).
// A mesma pista da página pública (adendo 5): raias, linha de chegada, botão inclinado.
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BotaoPrincipal, Campo } from '../../components/inscricao/controles.js';
import CurvasDeCanto from '../../components/marca/CurvasDeCanto.js';
import LogoCorrida from '../../components/marca/LogoCorrida.js';
import { Aviso } from '../../components/org/ui.js';
import { apiOrg } from '../../lib/api-org.js';
import { ROTULO_LARGADA, diasParaLargada } from '../../lib/evento.js';
const TAREFAS = ['Conferência dos comprovantes', 'Inscrição no balcão', 'Sorteio dos convidados', 'Painel e listas'];
export default function EntrarPage() {
    const [busca] = useSearchParams();
    const navegar = useNavigate();
    const [login, setLogin] = useState('demo.organizacao');
    const [senha, setSenha] = useState('demonstracao');
    const [mostrar, setMostrar] = useState(false);
    const [erro, setErro] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const dias = diasParaLargada();
    async function entrar(e) {
        e.preventDefault();
        setEnviando(true);
        setErro(null);
        try {
            await apiOrg.entrar(login, senha);
            const volta = busca.get('volta');
            navegar(volta && volta.startsWith('/org') ? volta : '/org');
        }
        catch (err) {
            setErro(err.message);
        }
        finally {
            setEnviando(false);
        }
    }
    return (h("div", { className: "fundo-raias relative min-h-screen overflow-hidden text-texto" },
        h(CurvasDeCanto, { className: "pointer-events-none absolute -right-8 -top-4 h-[220px] w-[270px] opacity-90" }),
        h("main", { className: "relative mx-auto grid min-h-screen w-full max-w-[1080px] content-center gap-10 px-4 py-10 md:grid-cols-[minmax(0,1fr)_420px] md:items-center md:gap-16 md:px-8" },
            h("section", { className: "grid gap-6" },
                h(LogoCorrida, { className: "block h-auto w-[180px] md:w-[240px]" }),
                h("div", null,
                    h("p", { className: "text-[13px] font-bold uppercase tracking-[0.16em] text-destaque" }, "Organiza\u00E7\u00E3o"),
                    h("h1", { className: "mt-1 text-balance font-display text-[46px] font-extrabold uppercase italic leading-[0.88] md:text-[76px]" },
                        "Mesa da ",
                        h("span", { className: "text-destaque" }, "corrida")),
                    h("p", { className: "mt-3 max-w-[46ch] text-texto-suave" }, dias > 0 ? (h(Fragment, null,
                        "Largada em ",
                        h("b", { className: "text-texto" },
                            dias,
                            " ",
                            dias === 1 ? 'dia' : 'dias'),
                        ` · ${ROTULO_LARGADA}`)) : ('Dia de corrida!'))),
                h("ul", { className: "hidden gap-2 md:grid", "aria-label": "O que a mesa faz" }, TAREFAS.map((t, i) => (h("li", { key: t, className: "flex items-center gap-3 border-b border-dashed border-trilho pb-2 last:border-0" },
                    h("b", { className: "numero-raia w-7 font-display text-[26px] font-extrabold italic leading-none" }, i + 1),
                    h("span", { className: "font-semibold" }, t)))))),
            h("form", { onSubmit: (e) => void entrar(e), className: "relative w-full overflow-hidden rounded-[22px] bg-superficie shadow-2xl" },
                h("div", { className: "linha-chegada h-3 w-full opacity-90", "aria-hidden": "true" }),
                h("div", { className: "grid gap-5 p-6 md:p-8" },
                    h("header", { className: "flex items-center gap-3" },
                        h("span", { className: "grid h-11 w-11 place-items-center rounded-xl bg-destaque text-destaque-texto", "aria-hidden": "true" },
                            h(LockKeyhole, { size: 22, strokeWidth: 2.4 })),
                        h("div", null,
                            h("h2", { className: "font-display text-[30px] font-extrabold uppercase italic leading-none" }, "Entrar"),
                            h("p", { className: "text-sm text-texto-suave" }, "Demonstra\u00E7\u00E3o: o login j\u00E1 vem preenchido e qualquer senha entra."))),
                    h(Campo, { rotulo: "Login", autoComplete: "username", autoCapitalize: "none", spellCheck: false, placeholder: "seu.login", value: login, onChange: (e) => setLogin(e.target.value) }),
                    h("div", { className: "relative" },
                        h(Campo, { rotulo: "Senha", type: mostrar ? 'text' : 'password', autoComplete: "current-password", className: "[&_input]:pr-12", value: senha, onChange: (e) => setSenha(e.target.value) }),
                        h("button", { type: "button", onClick: () => setMostrar((v) => !v), "aria-label": mostrar ? 'Esconder a senha' : 'Mostrar a senha', "aria-pressed": mostrar, className: "absolute bottom-0 right-0 grid h-12 w-12 place-items-center rounded-xl text-texto-suave hover:text-texto" }, mostrar ? h(EyeOff, { size: 20 }) : h(Eye, { size: 20 }))),
                    erro && h(Aviso, null, erro),
                    h(BotaoPrincipal, { type: "submit", disabled: enviando || !login || !senha }, enviando ? 'Entrando…' : 'Entrar na mesa →'),
                    h("p", { className: "border-t border-dashed border-trilho pt-4 text-xs leading-relaxed text-texto-suave" }, "Acesso restrito \u00E0 equipe da organiza\u00E7\u00E3o. Aqui h\u00E1 dados pessoais dos inscritos (LGPD): n\u00E3o compartilhe a sua senha e saia ao terminar num computador de uso comum."))))));
}
