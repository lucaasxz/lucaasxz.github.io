// O cliente da API da mesa. Na demonstração, as chamadas vão para a API
// simulada no navegador (lib/demo/api-simulada.js): mesmo contrato, nada sai daqui.
import { fetchDemo as fetch } from './demo/api-simulada.js';
export class ErroApi extends Error {
    status;
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}
const navegador = () => ({
    irPara: (url) => window.location.assign(`#${url}`),
    aqui: window.location.hash.replace(/^#/, '') || '/org',
});
/** fetch da mesa: JSON de ida e volta, 401 vai para o login, erro vira ErroApi. */
export async function chamarOrg(url, init, nav) {
    const r = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    });
    if (r.status === 401) {
        const n = nav ?? navegador();
        n.irPara(`/org/entrar?volta=${encodeURIComponent(n.aqui)}`);
        throw new ErroApi(401, 'Sessão expirada. Entre novamente.');
    }
    if (r.status === 204)
        return null;
    const dados = (await r.json().catch(() => ({})));
    if (!r.ok)
        throw new ErroApi(r.status, dados.erro ?? 'Algo deu errado. Tente de novo.');
    return dados;
}
const json = (corpo, method = 'POST') => ({ method, body: JSON.stringify(corpo) });
export const apiOrg = {
    sessao: () => chamarOrg('/api/org/sessao'),
    entrar: (login, senha) => 
    // O login não passa por chamarOrg: aqui 401 é "senha errada", não "sessão vencida".
    fetch('/api/org/sessao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, senha }) })
        .then(async (r) => {
        const d = (await r.json().catch(() => ({})));
        if (!r.ok)
            throw new ErroApi(r.status, d.erro ?? 'Não foi possível entrar.');
        return d;
    }),
    sair: () => chamarOrg('/api/org/sessao', { method: 'DELETE' }),
    painel: () => chamarOrg('/api/org/painel'),
    inscricoes: (f = {}) => {
        const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
        return chamarOrg(`/api/org/inscricoes?${q}`).then((r) => r.inscricoes);
    },
    conferir: (id, decisao, motivo) => chamarOrg(`/api/org/inscricoes/${id}/conferir`, json({ decisao, motivo })),
    /** O convidado sorteado (adendo 4): conferir o comprovante dele. */
    conferirConvidado: (id, decisao, motivo) => chamarOrg(`/api/org/inscricoes/${id}/conferir-convidado`, json({ decisao, motivo })),
    sortear: (grupoId, quantidade) => chamarOrg(`/api/org/grupos/${grupoId}/sorteio`, json({ quantidade })),
    /** incluiConvidado: a mesa confirma que o convidado sorteado sai junto. */
    cancelar: (id, motivo, incluiConvidado = false) => chamarOrg(`/api/org/inscricoes/${id}/cancelar`, json({ motivo, incluiConvidado })),
    cotas: (id, cotaColaborador) => chamarOrg(`/api/org/grupos/${id}`, json({ cotaColaborador }, 'PATCH')),
    config: () => chamarOrg('/api/org/config'),
    salvarConfig: (parcial) => chamarOrg('/api/org/config', json(parcial, 'PATCH')),
    importar: (csv, termosAceitos, aPartirDe) => chamarOrg('/api/org/inscricoes/importar', json({ csv, termosAceitos, aPartirDe })),
};
/** O balcão busca a matrícula na base (21/10): a mesma resposta da página, pela rota da mesa. */
export async function buscarColaboradorNaMesa(matricula) {
    try {
        const colaborador = await chamarOrg('/api/org/colaborador', json({ matricula }));
        return { ok: true, colaborador };
    }
    catch (e) {
        const status = e instanceof ErroApi ? e.status : 0;
        return {
            ok: false,
            erro: e instanceof ErroApi ? e.message : 'Sem conexão. Tente buscar de novo.',
            foraDaBase: status === 404,
            jaInscrita: status === 409,
        };
    }
}
/** Os bytes do comprovante (para a imagem ou o PDF da conferência). */
export async function baixarComprovante(id, de = 'colaborador') {
    const rota = de === 'convidado' ? 'comprovante-convidado' : 'comprovante';
    const r = await fetch(`/api/org/inscricoes/${id}/${rota}`, { credentials: 'same-origin' });
    if (!r.ok)
        throw new ErroApi(r.status, r.status === 404 ? 'Sem comprovante.' : 'Não foi possível abrir o comprovante.');
    return r.blob();
}
/** Baixa um CSV da mesa como arquivo (na demonstração, montado no navegador). */
export async function baixarCsv(lista) {
    const r = await fetch(`/api/org/exportar.csv?lista=${lista}`, { credentials: 'same-origin' });
    if (!r.ok)
        throw new ErroApi(r.status, 'Não foi possível exportar.');
    const url = URL.createObjectURL(await r.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: `corrida-${lista}.csv` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function percentual(ocupadas, cota) {
    if (cota <= 0)
        return 100;
    return Math.max(0, Math.min(100, Math.round((ocupadas / cota) * 100)));
}
/** Data e hora digitadas na tela (Brasília, sem horário de verão desde 2019). */
export function isoSaoPaulo(data, hora) {
    return `${data}T${hora}:00-03:00`;
}
export function proximoIndice(atual, total, direcao) {
    if (total === 0)
        return 0;
    return Math.max(0, Math.min(total - 1, atual + direcao));
}
const ROTULO = {
    pendente: 'Conferir pagamento',
    confirmada: 'Confirmada',
    aguardando_pagamento: 'Reserva (falta pagar)',
    lista_espera: 'Lista de espera',
    recusada: 'Recusada',
    cancelada: 'Cancelada',
    expirada: 'Expirada',
};
export const rotuloSituacao = (s) => ROTULO[s];
/** A posição de cada um na fila do PRÓPRIO turno, na ordem da lista (criado_em,
 *  como o servidor ordena). "Passa quem couber": quem leva convidado pode ser
 *  pulado se só abrir vaga de colaborador. */
export function posicoesNaFila(fila) {
    const contagem = {};
    return Object.fromEntries(fila.map((i) => [i.id, (contagem[i.grupoId] = (contagem[i.grupoId] ?? 0) + 1)]));
}
/** O que falta para a reserva vencer, como o painel mostra; menos de 6 h é urgente. */
export function tempoRestante(prazoIso, agora = new Date()) {
    const ms = Date.parse(prazoIso) - agora.getTime();
    if (ms <= 0)
        return { texto: 'vencido', urgente: true };
    const minutos = Math.ceil(ms / 60_000);
    const texto = minutos < 60 ? `vence em ${minutos} min` : `vence em ${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, '0')}`;
    return { texto, urgente: ms < 6 * 3_600_000 };
}
