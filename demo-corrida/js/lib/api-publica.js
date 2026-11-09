// O cliente da API pública. Na demonstração, as chamadas vão para a API
// simulada no navegador (lib/demo/api-simulada.js): mesmo contrato, nada sai daqui.
import { RECUSA } from './regras.js';
import { fetchDemo as fetch } from './demo/api-simulada.js';
const SEM_CONEXAO = 'Sem conexão. Seus dados continuam aqui — tente enviar de novo.';
export async function buscarVagas() {
    const r = await fetch('/api/vagas');
    if (!r.ok)
        throw new Error('Não foi possível carregar as vagas.');
    return (await r.json());
}
export async function buscarColaborador(matricula) {
    let r;
    try {
        r = await fetch('/api/colaborador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula }),
        });
    }
    catch {
        return { ok: false, erro: SEM_CONEXAO, foraDaBase: false, jaInscrita: false };
    }
    const dados = (await r.json().catch(() => ({})));
    if (r.ok)
        return { ok: true, colaborador: dados };
    return {
        ok: false,
        erro: dados.erro ?? 'Não foi possível buscar a matrícula. Tente de novo.',
        foraDaBase: r.status === 404,
        jaInscrita: r.status === 409 && dados.jaInscrita === true,
    };
}
export async function enviarInscricao(corpo, caminho = '/api/inscricoes') {
    let r;
    try {
        r = await fetch(caminho, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(corpo),
        });
    }
    catch {
        return { ok: false, status: 0, erro: SEM_CONEXAO };
    }
    const dados = (await r.json().catch(() => ({})));
    if (r.ok)
        return { ok: true, inscrita: dados };
    // 413 vem da plataforma, antes da API: o corpo passou do teto (o comprovante).
    const erro = r.status === 413 ? RECUSA.comprovante : (dados.erro ?? 'Não foi possível enviar. Tente de novo.');
    return dados.motivo ? { ok: false, status: r.status, erro, motivo: dados.motivo } : { ok: false, status: r.status, erro };
}
export async function buscarAcompanhamento(id, t) {
    const r = await fetch(`/api/inscricoes/${encodeURIComponent(id)}?t=${encodeURIComponent(t)}`);
    if (r.status === 404)
        return null;
    if (!r.ok)
        throw new Error('Não foi possível carregar a inscrição.');
    return (await r.json());
}
/** Pagar depois: o comprovante de quem está com a vaga reservada, pelo link —
 *  ou o do convidado sorteado (adendo 4). */
export async function enviarComprovanteDepois(id, t, comprovante, de = 'colaborador') {
    const rota = de === 'convidado' ? 'comprovante-convidado' : 'comprovante';
    let r;
    try {
        r = await fetch(`/api/inscricoes/${encodeURIComponent(id)}/${rota}?t=${encodeURIComponent(t)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comprovante }),
        });
    }
    catch {
        return { ok: false, erro: SEM_CONEXAO };
    }
    if (r.ok)
        return { ok: true };
    if (r.status === 413)
        return { ok: false, erro: RECUSA.comprovante };
    const dados = (await r.json().catch(() => ({})));
    return { ok: false, erro: dados.erro ?? 'Não foi possível enviar. Tente de novo.' };
}
/** O link de acompanhamento: o próprio documento + a rota no hash (a demo é estática). */
export function linkDeAcompanhamento(inscrita, origem = window.location.href.split('#')[0]) {
    return `${origem}#/acompanhar/${inscrita.id}?t=${inscrita.token}`;
}
/** 32 bytes aleatórios em base64url (43 caracteres): o token do link, gerado
 *  aqui para que um reenvio devolva a mesma inscrição. */
export function novoTokenNavegador() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
