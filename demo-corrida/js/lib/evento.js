// O dia da corrida e a contagem que o cabeçalho e o painel mostram.
// Na demonstração, a largada é sempre um sábado umas três semanas à frente.
function sabadoAFrente(agora = new Date()) {
    const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() + 21));
    d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7));
    return d.toISOString().slice(0, 10);
}
export const DATA_DA_CORRIDA = sabadoAFrente();
/** "sábado, 28/11": o rótulo da largada, a partir da data da corrida. */
export const ROTULO_LARGADA = `sábado, ${DATA_DA_CORRIDA.slice(8, 10)}/${DATA_DA_CORRIDA.slice(5, 7)}`;
/** A data de hoje em São Paulo, AAAA-MM-DD: a contagem vira à meia-noite daqui. */
function hojeEmSaoPaulo(agora) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}
/** Dias de calendário até a largada; no dia e depois, zero. */
export function diasParaLargada(agora = new Date()) {
    const hoje = Date.parse(`${hojeEmSaoPaulo(agora)}T00:00:00Z`);
    const largada = Date.parse(`${DATA_DA_CORRIDA}T00:00:00Z`);
    return Math.max(0, Math.round((largada - hoje) / 86_400_000));
}
