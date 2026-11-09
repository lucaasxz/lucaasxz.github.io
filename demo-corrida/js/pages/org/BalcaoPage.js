import { h, Fragment } from 'preact';
// /org/balcao — a inscrição presencial: o MESMO formulário e a MESMA trava, gravados com a
// origem balcão e quem registrou. Na tela larga, ao lado, as vagas de cada turno
// agora e o lembrete do que vale no balcão. A produção (21/10) se inscreve só
// aqui, no notebook do admin da corrida: sem o termo e sem anexo. A matrícula
// puxa o nome, o turno e o setor da base, como na página.
import { useCallback, useEffect, useState } from 'react';
import FormularioInscricao from '../../components/inscricao/FormularioInscricao.js';
import { Aviso, Cartao, Etiqueta } from '../../components/org/ui.js';
import { buscarVagas } from '../../lib/api-publica.js';
import { reais } from '../../lib/formato.js';
import { textoDoPrazo } from '../../lib/prazo.js';
export default function BalcaoPage() {
    const [vagas, setVagas] = useState(null);
    const [erro, setErro] = useState(null);
    const carregar = useCallback(async () => {
        try {
            setVagas(await buscarVagas());
        }
        catch {
            setErro('Não foi possível carregar as vagas.');
        }
    }, []);
    useEffect(() => {
        buscarVagas().then(setVagas).catch(() => setErro('Não foi possível carregar as vagas.'));
    }, []);
    if (erro)
        return h(Aviso, null, erro);
    if (!vagas)
        return h("p", { className: "text-texto-suave" }, "Carregando\u2026");
    return (h("div", { className: "grid items-start gap-4 xl:grid-cols-[minmax(0,46rem)_minmax(0,1fr)]" },
        h(Cartao, { titulo: "Inscri\u00E7\u00E3o no balc\u00E3o" },
            h("p", { className: "text-sm text-texto-suave" },
                "Digite a matr\u00EDcula: o nome, o turno e o setor v\u00EAm do cadastro (fora dele, escolha o turno e digite o nome). A produ\u00E7\u00E3o pula o termo e n\u00E3o anexa o comprovante: paga o Pix e manda o comprovante para o WhatsApp",
                vagas.whatsapp ? ` ${vagas.whatsapp}` : ' da organização',
                ". Pago na hora: marque \"Pago no balc\u00E3o\" e a inscri\u00E7\u00E3o j\u00E1 nasce confirmada."),
            h(FormularioInscricao, { modo: "balcao", vagas: vagas, aoRecarregarVagas: carregar, enviarPara: "/api/org/inscricoes" })),
        h("div", { className: "grid gap-4 xl:sticky xl:top-4" },
            h(Cartao, { titulo: "Vagas agora", acao: h("button", { type: "button", className: "text-sm font-semibold underline", onClick: () => void carregar() }, "Atualizar") },
                h("ul", { className: "grid gap-2" }, vagas.grupos.map((g, n) => (h("li", { key: g.id, className: "grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-superficie-2 px-3 py-2.5" },
                    h("span", { "aria-hidden": "true", className: "numero-raia text-center font-display text-3xl font-extrabold italic" }, n + 1),
                    h("span", { className: "min-w-0 font-bold leading-tight" },
                        g.nome,
                        h("small", { className: "block font-medium text-texto-suave" },
                            g.vagas,
                            " vagas")),
                    g.esgotado ? (h(Etiqueta, { tom: "perigo" }, "esgotado \u00B7 lista de espera")) : (h("span", { className: "text-right font-display text-[28px] font-extrabold italic leading-none tabular-nums" },
                        g.livresColaborador,
                        h("small", { className: "block text-xs font-semibold not-italic text-texto-suave" }, "livres")))))))),
            h(Cartao, { titulo: "No balc\u00E3o" },
                h("ul", { className: "grid gap-2 text-sm" },
                    h("li", null,
                        h("b", null, "Produ\u00E7\u00E3o"),
                        " (Turnos A, B e C): sem termo e sem anexo. A vaga fica reservada e a pessoa paga",
                        ' ',
                        reais(vagas.precos.colaborador),
                        " pelo Pix ",
                        textoDoPrazo(vagas.pagamentoAte),
                        ", com o comprovante no WhatsApp",
                        vagas.whatsapp ? ` ${vagas.whatsapp}` : ' da organização',
                        ". Quando ele chegar, confirme em Inscritos."),
                    h("li", null,
                        h("b", null, "Administrativo e Comercial:"),
                        " ",
                        reais(vagas.precos.colaborador),
                        ", com o termo e o comprovante, como na p\u00E1gina. Sem pagar, a vaga fica reservada e a pessoa paga ",
                        textoDoPrazo(vagas.pagamentoAte),
                        "."),
                    h("li", null,
                        h("b", null, "Convidado:"),
                        " entra na lista de espera dos convidados e n\u00E3o paga agora. Se for sorteado, paga",
                        ' ',
                        reais(vagas.precos.convidado),
                        ": pelo link fora da produ\u00E7\u00E3o, pelo WhatsApp na produ\u00E7\u00E3o."),
                    h("li", null,
                        h("b", null, "Turno esgotado:"),
                        " o colaborador entra na lista de espera e sobe sozinho quando abrir vaga."),
                    h("li", null,
                        h("b", null, "Pix:"),
                        " ",
                        vagas.pix.chave,
                        " \u00B7 ",
                        vagas.pix.texto))))));
}
