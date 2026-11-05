// -----------------------------------------------------------------------------
// react-router-dom.js — o pedaço do react-router-dom que as telas usam, sobre o
// HASH da URL (#/org/inscritos): a demonstração é estática, servida numa
// subpasta e dentro de iframe, sem fallback do servidor. BrowserRouter,
// Routes/Route (com um nível de rotas filhas e a rota index), Link, NavLink,
// Outlet, useNavigate, useParams, useSearchParams e useLocation.
// O import map do index.html aponta "react-router-dom" para cá.
// -----------------------------------------------------------------------------
import { createContext, h, toChildArray } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';

const Local = createContext({ pathname: '/', search: '', navegar: () => {} });
const Rota = createContext({ params: {}, outlet: null });
const ContextoDoOutlet = createContext(undefined);

/** O caminho e a busca vêm do hash: "#/acompanhar/x?t=y" → { pathname, search }. */
function atual() {
  const bruto = window.location.hash.replace(/^#/, '') || '/';
  const i = bruto.indexOf('?');
  const pathname = (i >= 0 ? bruto.slice(0, i) : bruto) || '/';
  return { pathname: pathname.startsWith('/') ? pathname : `/${pathname}`, search: i >= 0 ? bruto.slice(i) : '' };
}

/** O href de um caminho da aplicação: o documento atual + "#" + caminho. */
export const hrefDe = (para) => `#${para}`;

export function BrowserRouter({ children }) {
  const [local, setLocal] = useState(atual);
  useEffect(() => {
    const voltar = () => setLocal(atual());
    window.addEventListener('popstate', voltar);
    window.addEventListener('hashchange', voltar);
    return () => {
      window.removeEventListener('popstate', voltar);
      window.removeEventListener('hashchange', voltar);
    };
  }, []);
  const navegar = useCallback((para, opcoes = {}) => {
    // caminho relativo ("?x=1") resolve contra o caminho atual do hash
    const base = new URL(atual().pathname + atual().search, 'http://demo.local');
    const url = new URL(para, base);
    const destino = `${window.location.pathname}${window.location.search}#${url.pathname}${url.search}`;
    try {
      window.history[opcoes.replace ? 'replaceState' : 'pushState'](null, '', destino);
    } catch {
      window.location.hash = `${url.pathname}${url.search}`;
    }
    setLocal(atual());
  }, []);
  return h(Local.Provider, { value: { ...local, navegar } }, children);
}

const semBarraNoFim = (c) => (c.length > 1 ? c.replace(/\/+$/, '') : c);

/** Os parâmetros (:id) se o caminho casa com o padrão; null se não casa. */
function casar(padrao, caminho) {
  if (padrao === '*') return {};
  const p = semBarraNoFim(padrao).split('/');
  const c = semBarraNoFim(caminho).split('/');
  if (p.length !== c.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) {
      if (!c[i]) return null;
      params[p[i].slice(1)] = decodeURIComponent(c[i]);
    } else if (p[i] !== c[i]) {
      return null;
    }
  }
  return params;
}

export function Route() {
  return null;
}

export function Routes({ children }) {
  const { pathname } = useContext(Local);
  for (const rota of toChildArray(children)) {
    const { path, element, children: filhas } = rota.props;
    if (filhas) {
      for (const filha of toChildArray(filhas)) {
        const caminho = filha.props.index ? path : `${semBarraNoFim(path)}/${filha.props.path}`;
        const params = casar(caminho, pathname);
        if (params) return h(Rota.Provider, { value: { params, outlet: filha.props.element } }, element);
      }
      continue;
    }
    const params = casar(path, pathname);
    if (params) return h(Rota.Provider, { value: { params, outlet: null } }, element);
  }
  return null;
}

export function Outlet({ context }) {
  const { outlet } = useContext(Rota);
  return h(ContextoDoOutlet.Provider, { value: context }, outlet);
}

export const useOutletContext = () => useContext(ContextoDoOutlet);
export const useParams = () => useContext(Rota).params;
export const useNavigate = () => useContext(Local).navegar;

export function useLocation() {
  const { pathname, search } = useContext(Local);
  return { pathname, search };
}

export function useSearchParams() {
  const { pathname, search, navegar } = useContext(Local);
  const busca = useMemo(() => new URLSearchParams(search), [search]);
  const definir = (novo) => navegar(`${pathname}?${new URLSearchParams(novo)}`);
  return [busca, definir];
}

export function Link({ to, replace, onClick, children, ...resto }) {
  const { navegar } = useContext(Local);
  return h('a', {
    ...resto,
    href: hrefDe(to),
    onClick: (e) => {
      if (onClick) onClick(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || resto.target) return;
      e.preventDefault();
      navegar(to, { replace });
    },
  }, children);
}

export function NavLink({ to, end, className, children, ...resto }) {
  const { pathname } = useContext(Local);
  const aqui = semBarraNoFim(pathname);
  const ativo = end ? aqui === to : aqui === to || aqui.startsWith(`${to}/`);
  const classe = typeof className === 'function' ? className({ isActive: ativo }) : className;
  return h(Link, { ...resto, to, className: classe, 'aria-current': ativo ? 'page' : undefined }, children);
}
