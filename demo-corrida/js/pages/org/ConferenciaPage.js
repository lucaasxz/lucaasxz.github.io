import { h, Fragment } from 'preact';
// /org/conferencia — a fila de comprovantes para conferir: o comprovante ao
// lado do VALOR DEVIDO, Confirmar ou Recusar (com motivo), e a fila anda.
// Entram também os comprovantes do convidado sorteado (adendo 4), com o valor
// dele e a conferência dele. Atalhos: J ou → próxima, K ou ← anterior.
import { useEffect, useState } from 'react';
import { MODALIDADES } from '../../lib/regras.js';
import VisorDeComprovante from '../../components/org/VisorDeComprovante.js';
import { Aviso, Botao, Cartao, Etiqueta } from '../../components/org/ui.js';
import { apiOrg, proximoIndice, rotuloSituacao } from '../../lib/api-org.js';
import { reais } from '../../lib/formato.js';
import { useCarga } from '../../lib/use-carga.js';
export default function ConferenciaPage() {
    const colaboradores = useCarga(() => apiOrg.inscricoes({ situacao: 'pendente' }), []);
    const convidados = useCarga(() => apiOrg.inscricoes({ convidados: 'conferir' }), []);
    const [indice, setIndice] = useState(0);
    const [recusando, setRecusando] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [erro, setErro] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    const lista = [
        ...(colaboradores.dados ?? []).map((i) => ({ i, quem: 'colaborador' })),
        ...(convidados.dados ?? []).map((i) => ({ i, quem: 'convidado' })),
    ];
    const atual = lista[Math.min(indice, lista.length - 1)];
    useEffect(() => {
        function tecla(e) {
            const alvo = e.target;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))
                return;
            if (e.key === 'j' || e.key === 'ArrowRight')
                setIndice((i) => proximoIndice(i, lista.length, 1));
            if (e.key === 'k' || e.key === 'ArrowLeft')
                setIndice((i) => proximoIndice(i, lista.length, -1));
        }
        window.addEventListener('keydown', tecla);
        return () => window.removeEventListener('keydown', tecla);
    }, [lista.length]);
    async function decidir(decisao) {
        if (!atual)
            return;
        setOcupado(true);
        setErro(null);
        try {
            const m = decisao === 'recusada' ? motivo : undefined;
            if (atual.quem === 'convidado')
                await apiOrg.conferirConvidado(atual.i.id, decisao, m);
            else
                await apiOrg.conferir(atual.i.id, decisao, m);
            setRecusando(false);
            setMotivo('');
            colaboradores.recarregar();
            convidados.recarregar();
        }
        catch (e) {
            setErro(e.message);
        }
        finally {
            setOcupado(false);
        }
    }
    const falha = colaboradores.erro ?? convidados.erro;
    if (falha)
        return h(Aviso, null, falha);
    if (!colaboradores.dados || !convidados.dados)
        return h("p", { className: "text-texto-suave" }, "Carregando\u2026");
    if (!atual)
        return h(Cartao, { titulo: "Confer\u00EAncia" }, "Nenhum comprovante esperando confer\u00EAncia.");
    const { i, quem } = atual;
    const valor = quem === 'convidado' ? (i.convidado?.valorDevido ?? 0) : i.valorDevido;
    return (h("div", { className: "grid gap-4 lg:grid-cols-[20rem_1fr]" },
        h(Cartao, { titulo: `Para conferir (${lista.length})` },
            h("ul", { className: "grid max-h-[70vh] gap-1 overflow-y-auto" }, lista.map((item, n) => (h("li", { key: `${item.i.id}-${item.quem}` },
                h("button", { type: "button", onClick: () => setIndice(n), className: `w-full rounded-lg px-2 py-2 text-left text-sm ${item === atual ? 'bg-superficie-2 font-bold' : ''}` },
                    item.i.codigo,
                    " \u00B7 ",
                    item.quem === 'convidado' ? item.i.convidado?.nome : item.i.nome,
                    h("span", { className: "block text-xs text-texto-suave" },
                        item.quem === 'convidado' ? `convidado de ${item.i.nome} · ` : '',
                        reais(item.quem === 'convidado' ? (item.i.convidado?.valorDevido ?? 0) : item.i.valorDevido),
                        " \u00B7 ",
                        item.i.grupoNome))))))),
        h("div", { className: "grid gap-4 xl:grid-cols-[1fr_22rem]" },
            h(Cartao, { titulo: `Comprovante · nº ${i.codigo}`, acao: quem === 'convidado' ? h(Etiqueta, { tom: "alerta" }, "do convidado sorteado") : undefined },
                h(VisorDeComprovante, { inscricaoId: i.id, tem: quem === 'convidado' ? (i.convidado?.temComprovante ?? false) : i.temComprovante, de: quem })),
            h(Cartao, null,
                h("p", { className: "text-xs font-bold uppercase tracking-[0.1em] text-texto-suave" }, "Valor devido"),
                h("p", { className: "font-display text-[48px] font-extrabold italic leading-none text-cta" }, reais(valor)),
                h("p", { className: "mt-1 text-sm text-texto-suave" }, quem === 'convidado' ? 'Só o convidado sorteado' : 'Só o colaborador'),
                h("dl", { className: "mt-4 grid gap-1 text-sm" },
                    h("dt", { className: "text-texto-suave" }, quem === 'convidado' ? 'Colaborador que levou' : 'Nome'),
                    h("dd", { className: "font-semibold" }, i.nome),
                    h("dt", { className: "text-texto-suave" }, "Matr\u00EDcula \u00B7 grupo"),
                    h("dd", { className: "font-semibold" },
                        i.matricula,
                        " \u00B7 ",
                        i.grupoNome),
                    quem === 'convidado' ? (h(Fragment, null,
                        h("dt", { className: "text-texto-suave" }, "Convidado"),
                        h("dd", { className: "font-semibold" },
                            i.convidado?.nome,
                            " \u00B7 ",
                            i.convidado && MODALIDADES[i.convidado.modalidade]))) : (h(Fragment, null,
                        h("dt", { className: "text-texto-suave" }, "Prova"),
                        h("dd", { className: "font-semibold" }, MODALIDADES[i.modalidade]),
                        i.convidado && (h(Fragment, null,
                            h("dt", { className: "text-texto-suave" }, "Convidado"),
                            h("dd", { className: "font-semibold" },
                                i.convidado.nome,
                                " \u00B7 ",
                                rotuloSituacao(i.convidado.situacao).toLowerCase(),
                                " (paga \u00E0 parte)")))))),
                h("div", { className: "mt-4 grid gap-2" },
                    erro && h(Aviso, null, erro),
                    !recusando ? (h(Fragment, null,
                        h(Botao, { variante: "primario", disabled: ocupado, onClick: () => void decidir('confirmada') }, "Confirmar pagamento"),
                        h(Botao, { variante: "perigo", disabled: ocupado, onClick: () => setRecusando(true) }, "Recusar\u2026"))) : (h(Fragment, null,
                        h("label", { className: "grid gap-1 text-sm font-semibold" },
                            "Motivo da recusa",
                            h("textarea", { className: "min-h-20 rounded-xl border-2 border-borda bg-superficie p-2 text-base font-normal", value: motivo, onChange: (e) => setMotivo(e.target.value) })),
                        h(Botao, { variante: "perigo", disabled: ocupado || motivo.trim().length < 3, onClick: () => void decidir('recusada') }, "Confirmar recusa"),
                        h(Botao, { onClick: () => setRecusando(false) }, "Voltar"))),
                    h("p", { className: "text-xs text-texto-suave" }, "Atalhos: J ou \u2192 pr\u00F3xima \u00B7 K ou \u2190 anterior"))))));
}
