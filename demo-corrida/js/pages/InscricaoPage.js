import { h, Fragment } from 'preact';
// `/` — a página pública: celular primeiro,
// identidade do evento, direção B · Pista. Antes do formulário, a abertura com o
// boneco 3D (adendo 5), uma vez por sessão; a página carrega por baixo dela.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECUSA } from '../lib/regras.js';
import Abertura from '../components/abertura/Abertura.js';
import FormularioInscricao from '../components/inscricao/FormularioInscricao.js';
import CabecalhoEvento from '../components/marca/CabecalhoEvento.js';
import { deveMostrarAbertura, lembrarAbertura } from '../lib/abertura.js';
import { buscarVagas } from '../lib/api-publica.js';
function memoriaDaSessao() {
    try {
        return window.sessionStorage;
    }
    catch {
        return null;
    }
}
function ultimaInscricao() {
    try {
        const bruto = localStorage.getItem('corrida.ultima');
        return bruto ? JSON.parse(bruto) : null;
    }
    catch {
        return null;
    }
}
export function MolduraEvento({ children }) {
    return (h("div", { className: "marca-evento fundo-raias min-h-screen bg-fundo text-texto" },
        h("main", { className: "mx-auto max-w-[420px] overflow-hidden pb-10" }, children)));
}
export default function InscricaoPage() {
    const [vagas, setVagas] = useState(null);
    const [falhou, setFalhou] = useState(false);
    const [ultima] = useState(ultimaInscricao);
    const [abertura, setAbertura] = useState(() => deveMostrarAbertura(memoriaDaSessao()));
    // Inscrições fechadas: nada a começar, a abertura não entra.
    const mostrarAbertura = abertura && !(vagas && !vagas.abertas);
    const comecar = useCallback(() => {
        lembrarAbertura(memoriaDaSessao());
        setAbertura(false);
    }, []);
    const camadaDeAbertura = mostrarAbertura ? h(Abertura, { pronto: vagas !== null || falhou, aoComecar: comecar }) : null;
    const carregar = useCallback(async () => {
        try {
            setVagas(await buscarVagas());
            setFalhou(false);
        }
        catch {
            setFalhou(true);
        }
    }, []);
    useEffect(() => {
        buscarVagas()
            .then(setVagas)
            .catch(() => setFalhou(true));
    }, []);
    if (falhou) {
        return (h(MolduraEvento, null,
            camadaDeAbertura,
            h(CabecalhoEvento, { chamada: "" }),
            h("div", { className: "grid gap-3 px-4" },
                h("p", { role: "alert", className: "font-semibold" }, "N\u00E3o foi poss\u00EDvel carregar as vagas agora."),
                h("button", { type: "button", className: "min-h-11 justify-self-start font-semibold underline", onClick: () => void carregar() }, "Tentar de novo"))));
    }
    if (!vagas) {
        return (h(MolduraEvento, null,
            camadaDeAbertura,
            h(CabecalhoEvento, null),
            h("p", { className: "px-4 text-texto-suave" }, "Carregando as vagas\u2026")));
    }
    if (!vagas.abertas) {
        return (h(MolduraEvento, null,
            h(CabecalhoEvento, { chamada: "" }),
            h("div", { className: "grid gap-3 px-4" },
                h("p", { className: "text-[22px] font-bold leading-tight" }, RECUSA.encerradas),
                vagas.whatsapp && h("p", { className: "text-texto-suave" },
                    "D\u00FAvidas: WhatsApp ",
                    vagas.whatsapp))));
    }
    return (h(MolduraEvento, null,
        camadaDeAbertura,
        h(CabecalhoEvento, null),
        h("div", { className: "px-4" },
            ultima && (h("p", { className: "mt-2 rounded-xl border-2 border-borda bg-superficie px-3 py-2 text-sm" },
                "Voc\u00EA j\u00E1 se inscreveu (n\u00BA ",
                ultima.codigo,
                ").",
                ' ',
                h(Link, { className: "font-semibold underline", to: `/acompanhar/${ultima.id}?t=${ultima.token}` }, "Acompanhar"))),
            h(FormularioInscricao, { modo: "publico", vagas: vagas, aoRecarregarVagas: carregar }))));
}
