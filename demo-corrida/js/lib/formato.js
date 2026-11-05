const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** Centavos → "R$ 15,00" (o Intl põe espaço não separável; aqui vai o comum). */
export function reais(centavos) {
    return BRL.format(centavos / 100).replace(/\s/g, ' ');
}
const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
/** ISO (UTC) → "22/10 às 13:00", sempre no fuso de Brasília. */
export function dataHora(iso) {
    const p = Object.fromEntries(DATA_HORA.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.day}/${p.month} às ${p.hour}:${p.minute}`;
}
/** A máscara de digitação do telefone é a mesma regra do servidor. */
export { formatarTelefone as mascaraTelefone } from './regras.js';
