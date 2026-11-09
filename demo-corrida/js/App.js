import { h, Fragment } from 'preact';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { recomecarDemo } from './lib/demo/api-simulada.js';
import OrgShell from './components/org/OrgShell.js';
import AcompanharPage from './pages/AcompanharPage.js';
import InscricaoPage, { MolduraEvento } from './pages/InscricaoPage.js';
import BalcaoPage from './pages/org/BalcaoPage.js';
import ConferenciaPage from './pages/org/ConferenciaPage.js';
import ConfiguracaoPage from './pages/org/ConfiguracaoPage.js';
import EntrarPage from './pages/org/EntrarPage.js';
import InscritosPage from './pages/org/InscritosPage.js';
import PainelPage from './pages/org/PainelPage.js';
function NaoEncontrada() {
    return (h(MolduraEvento, null,
        h("div", { className: "grid gap-3 px-4 pt-10" },
            h("p", { className: "text-[22px] font-bold" }, "P\u00E1gina n\u00E3o encontrada."),
            h(Link, { to: "/", className: "font-semibold underline" }, "Ir para a inscri\u00E7\u00E3o"))));
}
/** O selo fixo da demonstração e a troca entre a página e a mesa. */
function SeloDemo() {
    const { pathname } = useLocation();
    const naMesa = pathname.startsWith('/org');
    return (h("aside", { className: "demo-selo", "aria-label": "Demonstração" },
        h("span", { className: "demo-selo-rotulo" }, "Demonstração · dados fictícios"),
        h("nav", { className: "demo-selo-troca", "aria-label": "Trocar de tela" },
            h(Link, { to: "/", "aria-current": naMesa ? undefined : 'page' }, "Inscrição"),
            h(Link, { to: "/org", "aria-current": naMesa ? 'page' : undefined }, "Mesa da organização")),
        h("button", { type: "button", className: "demo-selo-recomecar", title: "Volta os dados fictícios ao início", onClick: () => {
                recomecarDemo();
                window.location.hash = '#/';
                window.location.reload();
            } }, "Recomeçar")));
}
export default function App() {
    return (h(BrowserRouter, null,
        h(SeloDemo, null),
        h(Routes, null,
            h(Route, { path: "/", element: h(InscricaoPage, null) }),
            h(Route, { path: "/acompanhar/:id", element: h(AcompanharPage, null) }),
            h(Route, { path: "/org/entrar", element: h(EntrarPage, null) }),
            h(Route, { path: "/org", element: h(OrgShell, null) },
                h(Route, { index: true, element: h(PainelPage, null) }),
                h(Route, { path: "conferencia", element: h(ConferenciaPage, null) }),
                h(Route, { path: "inscritos", element: h(InscritosPage, null) }),
                h(Route, { path: "balcao", element: h(BalcaoPage, null) }),
                h(Route, { path: "configuracao", element: h(ConfiguracaoPage, null) })),
            h(Route, { path: "*", element: h(NaoEncontrada, null) }))));
}
