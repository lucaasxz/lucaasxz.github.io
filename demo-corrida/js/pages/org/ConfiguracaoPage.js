import { h, Fragment } from 'preact';
// /org/configuracao — as cotas por grupo, preços, textos do Pix, abertura das
// inscrições e a importação das inscrições anteriores (CSV, em lotes).
import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { COLUNAS_IMPORTACAO } from '../../lib/regras.js';
import { Campo, Caixa } from '../../components/inscricao/controles.js';
import { Aviso, Botao, Cartao } from '../../components/org/ui.js';
import { apiOrg, isoSaoPaulo } from '../../lib/api-org.js';
import { dataHora, reais } from '../../lib/formato.js';
import { useCarga } from '../../lib/use-carga.js';
function LinhaCota({ g, aoSalvar }) {
    const [col, setCol] = useState(String(g.cotaColaborador));
    const [msg, setMsg] = useState(null);
    async function salvar() {
        try {
            await apiOrg.cotas(g.id, Number(col));
            setMsg({ tom: 'sucesso', texto: 'Vagas salvas.' });
            aoSalvar();
        }
        catch (e) {
            setMsg({ tom: 'perigo', texto: e.message });
        }
    }
    return (h("div", { className: "grid gap-2 border-b border-borda/40 py-3 md:grid-cols-[1fr_9rem_auto] md:items-end" },
        h("p", { className: "font-semibold" },
            g.nome,
            h("span", { className: "block text-xs font-normal text-texto-suave" },
                "ocupadas ",
                g.ocupadasColaborador,
                " colaboradores + ",
                g.ocupadasConvidado,
                " convidados sorteados \u00B7 ",
                g.fila,
                " na fila")),
        h(Campo, { rotulo: "Vagas do turno", inputMode: "numeric", value: col, onChange: (e) => setCol(e.target.value.replace(/\D/g, '')) }),
        h(Botao, { onClick: () => void salvar() }, "Salvar"),
        msg && h("div", { className: "md:col-span-3" },
            h(Aviso, { tom: msg.tom }, msg.texto))));
}
function Importacao() {
    const [csv, setCsv] = useState(null);
    const [nome, setNome] = useState('');
    const [termos, setTermos] = useState(false);
    const [progresso, setProgresso] = useState(null);
    const [recusadas, setRecusadas] = useState([]);
    const [importadas, setImportadas] = useState(0);
    const [erro, setErro] = useState(null);
    function baixarModelo() {
        const exemplo = ['000999', 'Ana Beatriz Costa', 'Usinagem', 'turno_b', '11999999999', 'corrida', 'M', 'Maria Costa', '1133334444', '', '', '', '', 'sim', 'não'];
        const texto = `﻿${COLUNAS_IMPORTACAO.join(';')}\r\n${exemplo.join(';')}\r\n`;
        const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
        Object.assign(document.createElement('a'), { href: url, download: 'corrida-modelo-importacao.csv' }).click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    async function importar() {
        if (!csv)
            return;
        setErro(null);
        setRecusadas([]);
        setImportadas(0);
        let aPartirDe = 0;
        try {
            while (aPartirDe !== null) {
                const r = await apiOrg.importar(csv, termos, aPartirDe);
                setRecusadas((x) => [...x, ...r.linhas.filter((l) => !l.ok)]);
                setImportadas((n) => n + r.linhas.filter((l) => l.ok).length);
                setProgresso({ feitas: r.proxima ?? r.total, total: r.total });
                aPartirDe = r.proxima;
            }
        }
        catch (e) {
            setErro(e.message);
        }
    }
    return (h(Cartao, { titulo: "Importar inscri\u00E7\u00F5es anteriores (Forms e 1\u00AA fase)" },
        h("p", { className: "mb-3 text-sm text-texto-suave" }, "Cada linha passa pelas mesmas regras e pela mesma trava de vagas. Reimportar o mesmo arquivo \u00E9 seguro: quem j\u00E1 entrou volta como \"j\u00E1 tem inscri\u00E7\u00E3o\". Sem \"pago\", a vaga fica reservada por 24 h."),
        h("div", { className: "grid gap-3" },
            h(Botao, { onClick: baixarModelo, className: "justify-self-start" }, "Baixar modelo (CSV)"),
            h("label", { className: "grid min-h-12 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-borda px-3 py-3 text-center font-semibold" },
                nome || 'Escolher a planilha (CSV)',
                h("input", { type: "file", accept: ".csv,text/csv", className: "sr-only", onChange: (e) => {
                        const f = e.target.files?.[0];
                        if (!f)
                            return;
                        setNome(f.name);
                        f.text().then(setCsv);
                    } })),
            h(Caixa, { marcada: termos, aoMudar: setTermos }, "As pessoas desta planilha aceitaram os termos de sa\u00FAde e LGPD na inscri\u00E7\u00E3o original."),
            h(Botao, { variante: "primario", disabled: !csv || !termos, onClick: () => void importar() }, "Importar"),
            progresso && h("p", { className: "text-sm" },
                progresso.feitas,
                " de ",
                progresso.total,
                " linhas \u00B7 ",
                importadas,
                " importadas \u00B7 ",
                recusadas.length,
                " recusadas"),
            erro && h(Aviso, null, erro),
            recusadas.length > 0 && (h("ul", { className: "grid gap-1 text-sm" }, recusadas.map((r) => h("li", { key: r.linha },
                h("b", null,
                    "Linha ",
                    r.linha,
                    ":"),
                " ",
                r.erro)))))));
}
function formDe() {
    return {
        ateData: '',
        ateHora: '23:59',
        pagData: '',
        pagHora: '15:00',
    };
}
/** Os ajustes de abertura, preços e textos — começa do que está salvo. */
function Ajustes({ c, salvar }) {
    const [form, setForm] = useState(formDe);
    const mudar = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    return (h(Fragment, null,
        h(Cartao, { titulo: "Inscri\u00E7\u00F5es" },
            h("p", { className: "text-sm" },
                "Agora: ",
                h("b", null, c.abertas ? 'abertas' : 'fechadas'),
                c.inscricoesAte && ` · encerram em ${dataHora(c.inscricoesAte)}`),
            h("div", { className: "mt-3 flex flex-wrap items-end gap-2" },
                h(Botao, { variante: c.inscricoesAbertas ? 'perigo' : 'primario', onClick: () => {
                        if (window.confirm(c.inscricoesAbertas ? 'Fechar as inscrições da página pública?' : 'Abrir as inscrições na página pública?'))
                            void salvar({ inscricoesAbertas: !c.inscricoesAbertas });
                    } }, c.inscricoesAbertas ? 'Fechar inscrições' : 'Abrir inscrições'),
                h(Campo, { rotulo: "Encerrar em (data)", type: "date", value: form.ateData, onChange: mudar('ateData') }),
                h(Campo, { rotulo: "Hora", type: "time", value: form.ateHora, onChange: mudar('ateHora') }),
                h(Botao, { disabled: !form.ateData, onClick: () => void salvar({ inscricoesAte: isoSaoPaulo(form.ateData, form.ateHora || '23:59') }) }, "Definir prazo"),
                c.inscricoesAte && h(Botao, { onClick: () => void salvar({ inscricoesAte: null }) }, "Tirar prazo"))),
        h(Cartao, { titulo: "Prazo para pagar" },
            h("p", { className: "text-sm" }, c.pagamentoAte ? (h(Fragment, null,
                "Quem reserva paga at\u00E9 ",
                h("b", null, dataHora(c.pagamentoAte)),
                ". Depois disso, quem for chamado da fila ou sorteado tem 24 h.")) : ('Sem data fixa: cada reserva tem 24 h para pagar.')),
            h("div", { className: "mt-3 flex flex-wrap items-end gap-2" },
                h(Campo, { rotulo: "Pagar at\u00E9 (data)", type: "date", value: form.pagData, onChange: mudar('pagData') }),
                h(Campo, { rotulo: "Hora", type: "time", value: form.pagHora, onChange: mudar('pagHora') }),
                h(Botao, { disabled: !form.pagData, onClick: () => void salvar({ pagamentoAte: isoSaoPaulo(form.pagData, form.pagHora || '15:00') }) }, "Definir data fixa"),
                c.pagamentoAte && h(Botao, { onClick: () => void salvar({ pagamentoAte: null }) }, "Voltar \u00E0s 24 h")),
            h("p", { className: "mt-2 text-xs text-texto-suave" }, "Vale para as reservas novas e para quem for chamado da fila; as reservas j\u00E1 abertas mant\u00EAm o prazo que t\u00EAm.")),
        h(Cartao, { titulo: "Pre\u00E7os e Pix", acao: h("span", { className: "inline-flex items-center gap-1.5 rounded-full border-2 border-borda px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-texto-suave" },
                h(LockKeyhole, { size: 14, strokeWidth: 2.6, "aria-hidden": "true" }),
                " Travado") },
            h("dl", { className: "grid gap-3 md:grid-cols-2" }, [
                ['Colaborador', reais(c.precos.colaborador)],
                ['Convidado', reais(c.precos.convidado)],
                ['Chave Pix', c.chavePix],
                ['Banco, agência e conta', c.textoPagamento],
                ['WhatsApp do comprovante', c.whatsapp ?? '—'],
                ['Canal do encarregado (LGPD)', c.canalEncarregado ?? '—'],
            ].map(([rotulo, valor]) => (h("div", { key: rotulo, className: "grid gap-1 rounded-xl border-2 border-dashed border-borda px-3 py-2.5" },
                h("dt", { className: "text-[13px] font-bold uppercase tracking-[0.08em] text-texto-suave" }, rotulo),
                h("dd", { className: "font-semibold" }, valor))))),
            h("p", { className: "mt-3 text-xs text-texto-suave" }, "Travados: os pre\u00E7os e os dados do Pix n\u00E3o mudam pela mesa."))));
}
export default function ConfiguracaoPage() {
    const config = useCarga(() => apiOrg.config(), []);
    const painel = useCarga(() => apiOrg.painel(), []);
    const [msg, setMsg] = useState(null);
    const c = config.dados;
    async function salvar(parcial) {
        setMsg(null);
        try {
            await apiOrg.salvarConfig(parcial);
            setMsg({ tom: 'sucesso', texto: 'Configuração salva.' });
            config.recarregar();
        }
        catch (e) {
            setMsg({ tom: 'perigo', texto: e.message });
        }
    }
    if (config.erro)
        return h(Aviso, null, config.erro);
    if (!c)
        return h("p", { className: "text-texto-suave" }, "Carregando\u2026");
    return (h("div", { className: "grid gap-4" },
        h(Ajustes, { key: JSON.stringify(c), c: c, salvar: salvar }),
        msg && h(Aviso, { tom: msg.tom }, msg.texto),
        h(Cartao, { titulo: "Cotas por grupo" },
            h("p", { className: "text-sm text-texto-suave" }, "N\u00E3o d\u00E1 para baixar a cota abaixo de quem j\u00E1 ocupa vaga. Cota maior chama a lista de espera na hora."),
            painel.dados?.grupos.map((g) => h(LinhaCota, { key: `${g.id}-${g.cotaColaborador}`, g: g, aoSalvar: () => painel.recarregar() }))),
        h(Importacao, null)));
}
