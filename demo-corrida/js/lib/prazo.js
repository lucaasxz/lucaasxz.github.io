// O prazo para pagar a reserva, em texto (regra da 0010): até a data fixa da
// configuração, ela; depois dela, 24 h.
/** "até 23/10 às 15:00" antes da data fixa; "em até 24 h" depois dela, ou sem ela. */
export function textoDoPrazo(pagamentoAte, agora = new Date()) {
    if (!pagamentoAte || agora.getTime() >= Date.parse(pagamentoAte))
        return 'em até 24 h';
    const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const partes = Object.fromEntries(f.formatToParts(new Date(pagamentoAte)).map((p) => [p.type, p.value]));
    return `até ${partes.day}/${partes.month} às ${partes.hour}:${partes.minute}`;
}
