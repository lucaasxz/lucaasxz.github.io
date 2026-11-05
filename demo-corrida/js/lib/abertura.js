// A abertura da página pública (adendo 5): o boneco corre enquanto a página
// carrega e, em 100%, levanta o troféu. Aqui só a conta e a memória da sessão;
// a cena 3D mora em components/abertura (carregada à parte).
export const DURACAO_ABERTURA = 3200;
const CHAVE = 'corrida.abertura';
const suave = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
/** 0 a 1 com o tempo; sem os dados da página, segura em 90%: o troféu só sobe
 *  quando o formulário já pode abrir. */
export function progressoDaAbertura(decorridoMs, pronto) {
    const p = suave(Math.min(1, Math.max(0, decorridoMs / DURACAO_ABERTURA)));
    return pronto ? p : Math.min(0.9, p);
}
const RECADOS = [
    [0, 'Amarrando o tênis'],
    [0.25, 'Aquecendo'],
    [0.55, 'No ritmo'],
    [0.85, 'Reta final'],
    [1, 'Chegou!'],
];
export function recadoDoProgresso(p) {
    let recado = RECADOS[0][1];
    for (const [limite, texto] of RECADOS)
        if (p >= limite)
            recado = texto;
    return recado;
}
/** Uma vez por sessão. Armazenamento bloqueado (aba privada): mostra. */
export function deveMostrarAbertura(memoria) {
    try {
        return memoria?.getItem(CHAVE) !== '1';
    }
    catch {
        return true;
    }
}
export function lembrarAbertura(memoria) {
    try {
        memoria?.setItem(CHAVE, '1');
    }
    catch {
        // Sem armazenamento: a abertura volta na próxima visita, e tudo bem.
    }
}
