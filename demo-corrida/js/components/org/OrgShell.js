import { h, Fragment } from 'preact';
// A moldura da mesa: a barra verde-escura com a logo e as abas (adendo 5: a
// mesma identidade da página), e a conferência da sessão. Sem sessão, o cliente
// leva para /org/entrar (chamarOrg trata o 401).
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiOrg } from '../../lib/api-org.js';
import LogoCorrida from '../marca/LogoCorrida.js';
const ABAS = [
    { para: '/org', rotulo: 'Painel', fim: true },
    { para: '/org/conferencia', rotulo: 'Conferência' },
    { para: '/org/inscritos', rotulo: 'Inscritos' },
    { para: '/org/balcao', rotulo: 'Balcão' },
    { para: '/org/configuracao', rotulo: 'Configuração' },
];
export default function OrgShell() {
    const [sessao, setSessao] = useState(null);
    const navegar = useNavigate();
    useEffect(() => {
        apiOrg.sessao().then(setSessao).catch(() => { });
    }, []);
    async function sair() {
        await apiOrg.sair().catch(() => { });
        navegar('/org/entrar');
    }
    if (!sessao)
        return h("p", { className: "p-6 text-texto-suave" }, "Carregando\u2026");
    return (h("div", { className: "min-h-screen bg-fundo text-texto print:bg-papel" },
        h("header", { className: "bg-barra text-barra-texto print:hidden" },
            h("div", { className: "flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8" },
                h("span", { className: "flex items-center gap-2", style: { ['--logo']: 'var(--barra-texto)' } },
                    h(LogoCorrida, { className: "block h-auto w-[118px]" }),
                    h("span", { className: "text-sm font-semibold opacity-75" }, "\u00B7 Organiza\u00E7\u00E3o")),
                h("nav", { className: "order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1", "aria-label": "Mesa da organiza\u00E7\u00E3o" }, ABAS.map((a) => (h(NavLink, { key: a.para, to: a.para, end: a.fim, className: ({ isActive }) => clsx('whitespace-nowrap rounded-[10px] px-3.5 py-2 text-sm font-semibold', isActive ? 'bg-destaque text-destaque-texto' : 'text-barra-texto/75 hover:text-barra-texto') }, a.rotulo)))),
                h("div", { className: "ml-auto flex items-center gap-3 text-sm" },
                    h("span", null,
                        h("b", null, sessao.nome),
                        " ",
                        h("span", { className: "opacity-75" },
                            "\u00B7 ",
                            sessao.papel)),
                    h("button", { type: "button", onClick: () => void sair(), className: "min-h-11 font-semibold underline" }, "Sair")))),
        h("main", { className: "w-full px-4 py-5 md:px-8 print:p-0" },
            h(Outlet, { context: sessao }))));
}
