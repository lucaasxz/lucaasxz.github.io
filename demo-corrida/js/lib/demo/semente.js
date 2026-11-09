// -----------------------------------------------------------------------------
// semente.js — os dados FICTÍCIOS da demonstração: grupos com cotas inventadas,
// uma base de colaboradores com nomes genéricos e inscrições em todas as
// situações (reserva sem pagamento, comprovante para conferir, confirmada, lista
// de espera, recusada, cancelada), com convidados na fila, sorteados e pagos.
// Nada aqui vem de pessoas, turnos ou valores reais.
// -----------------------------------------------------------------------------

export const LOGIN_DEMO = { login: 'demo.organizacao', nome: 'Equipe de demonstração', papel: 'admin' };

/** Matrículas sugeridas na tela (a hint do passo 1). */
export const MATRICULAS_DEMO = [
  { matricula: '000317', rotulo: 'Administrativo · com vaga' },
  { matricula: '000318', rotulo: 'Administrativo · com vaga' },
  { matricula: '000409', rotulo: 'Comercial · esgotado → lista de espera' },
  { matricula: '000119', rotulo: 'Turno A · produção (só no balcão)' },
  { matricula: '000301', rotulo: 'já inscrita' },
];

const PRIMEIROS = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Renata', 'Sérgio', 'Tatiana', 'Vinícius',
  'Larissa', 'Rafael', 'Beatriz', 'Gustavo', 'Camila', 'Diego', 'Fernanda', 'Marcelo', 'Patrícia', 'Thiago',
  'Juliana', 'Rodrigo', 'Aline', 'Caio', 'Débora', 'Igor', 'Letícia', 'Murilo', 'Priscila', 'Otávio',
];
const SOBRENOMES = [
  'Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Ferreira', 'Gomes', 'Martins', 'Araújo',
  'Ribeiro', 'Carvalho', 'Rocha', 'Barbosa', 'Teixeira', 'Moreira', 'Cardoso', 'Nunes', 'Mendes', 'Freitas',
  'Lima', 'Castro', 'Pinto', 'Moura', 'Campos', 'Vieira', 'Duarte', 'Ramos',
];

function nomeDe(i) {
  const s1 = (i * 5 + 3) % SOBRENOMES.length;
  let s2 = (i * 11 + 1) % SOBRENOMES.length;
  if (s2 === s1) s2 = (s2 + 7) % SOBRENOMES.length;
  return `${PRIMEIROS[(i * 7) % PRIMEIROS.length]} ${SOBRENOMES[s1]} ${SOBRENOMES[s2]}`;
}
const convidadoDe = (i) => `${PRIMEIROS[(i * 13 + 5) % PRIMEIROS.length]} ${SOBRENOMES[(i * 3 + 9) % SOBRENOMES.length]}`;
const telefoneDe = (i) => `1190000${String(1000 + i).slice(-4)}`;

const SETORES_PRODUCAO = ['Usinagem', 'Montagem', 'Pintura', 'Expedição', 'Manutenção', 'Almoxarifado'];
const SETORES_ADM = ['Financeiro', 'Compras', 'Pessoas', 'Tecnologia', 'Qualidade', 'Engenharia', 'Planejamento'];

export const GRUPOS = [
  { id: 'turno_a', nome: 'Turno A', cota: 30, ordem: 1 },
  { id: 'turno_b', nome: 'Turno B', cota: 20, ordem: 2 },
  { id: 'turno_c', nome: 'Turno C', cota: 12, ordem: 3 },
  { id: 'adm', nome: 'Administrativo', cota: 24, ordem: 4 },
  { id: 'comercial', nome: 'Comercial', cota: 6, ordem: 5 },
];

/** [primeira matrícula, quantas, grupo, setores (null = a pessoa informa)] */
const FAIXAS = [
  [101, 30, 'turno_a', SETORES_PRODUCAO],
  [131, 20, 'turno_b', SETORES_PRODUCAO],
  [151, 16, 'turno_c', SETORES_PRODUCAO],
  [301, 40, 'adm', SETORES_ADM],
  [401, 12, 'comercial', ['Vendas', 'Pós-venda']],
];

export function baseDeColaboradores() {
  const base = {};
  let n = 0;
  for (const [inicio, quantas, grupoId, setores] of FAIXAS) {
    for (let k = 0; k < quantas; k++) {
      const m = inicio + k;
      // alguns sem setor no cadastro: a pessoa digita no passo 2
      const setor = m % 9 === 0 ? null : setores[k % setores.length];
      base[String(m)] = { nome: nomeDe(n++), grupoId, setor };
    }
  }
  return base;
}

/**
 * As inscrições de partida. Cada linha: [matrícula, situação, opções].
 * opções: conv (situação do convidado), h (horas atrás), prazoH (horas até o
 * prazo), mod, criancas, motivo, origem.
 */
const INSCRICOES = [
  // Turno A — produção, pelo balcão
  [101, 'confirmada', { conv: 'lista_espera', h: 230 }],
  [102, 'confirmada', { h: 228 }],
  [103, 'confirmada', { h: 226, criancas: 2 }],
  [104, 'confirmada', { conv: 'lista_espera', h: 225 }],
  [105, 'confirmada', { h: 200, mod: 'caminhada_4' }],
  [106, 'confirmada', { h: 199 }],
  [107, 'aguardando_pagamento', { h: 30, prazoH: 4 }],
  [108, 'confirmada', { h: 190 }],
  [109, 'confirmada', { conv: 'confirmada', h: 188 }],
  [110, 'aguardando_pagamento', { h: 10, prazoH: 14 }],
  [111, 'confirmada', { h: 150, mod: 'caminhada_4', criancas: 1 }],
  [112, 'cancelada', { h: 140, motivo: 'Desistiu: viagem no dia da corrida.' }],
  [113, 'confirmada', { h: 120 }],
  [114, 'confirmada', { conv: 'lista_espera', h: 118 }],
  [115, 'aguardando_pagamento', { h: 3, prazoH: 21 }],
  [116, 'confirmada', { h: 100 }],
  // Turno B
  [131, 'confirmada', { h: 210 }],
  [132, 'confirmada', { h: 205, conv: 'lista_espera' }],
  [133, 'confirmada', { h: 180, mod: 'caminhada_4' }],
  [134, 'aguardando_pagamento', { h: 20, prazoH: 3 }],
  [135, 'confirmada', { h: 160 }],
  [136, 'cancelada', { h: 150, motivo: 'Mudou de turno.' }],
  [137, 'confirmada', { h: 90, criancas: 3 }],
  [138, 'aguardando_pagamento', { h: 2, prazoH: 22 }],
  // Turno C — lotado, com fila
  ...[151, 152, 153, 154, 155, 156, 157, 158, 159, 160].map((m, i) => [m, 'confirmada', { h: 220 - i * 12, ...(i === 2 ? { conv: 'lista_espera' } : {}) }]),
  [161, 'aguardando_pagamento', { h: 26, prazoH: 9 }],
  [162, 'aguardando_pagamento', { h: 5, prazoH: 19 }],
  [163, 'lista_espera', { h: 4 }],
  [164, 'lista_espera', { h: 1 }],
  // Administrativo — pela página
  [301, 'confirmada', { conv: 'lista_espera', h: 236, origem: 'online' }],
  [302, 'confirmada', { conv: 'lista_espera', h: 233, origem: 'online', criancas: 1 }],
  [303, 'confirmada', { conv: 'aguardando_pagamento', h: 220, origem: 'online', prazoConvH: 16 }],
  [304, 'confirmada', { conv: 'pendente', h: 215, origem: 'online' }],
  [306, 'confirmada', { h: 170, origem: 'online', mod: 'caminhada_4' }],
  [307, 'confirmada', { h: 150, origem: 'online' }],
  [308, 'confirmada', { h: 140, origem: 'online' }],
  [309, 'pendente', { h: 20, origem: 'online' }],
  [310, 'pendente', { h: 9, origem: 'online', conv: 'lista_espera' }],
  [311, 'pendente', { h: 6, origem: 'online', criancas: 2 }],
  [312, 'pendente', { h: 2, origem: 'online', mod: 'caminhada_4' }],
  [313, 'aguardando_pagamento', { h: 12, prazoH: 12, origem: 'online' }],
  [314, 'aguardando_pagamento', { h: 1, prazoH: 23, origem: 'online' }],
  [315, 'recusada', { h: 60, origem: 'online', motivo: 'O comprovante enviado é de outro valor.' }],
  [316, 'cancelada', { h: 48, origem: 'online', motivo: 'Pedido do colaborador.' }],
  // Comercial — lotado, com fila
  [401, 'confirmada', { h: 200, origem: 'online' }],
  [402, 'confirmada', { h: 190, origem: 'online', conv: 'lista_espera' }],
  [403, 'confirmada', { h: 170, origem: 'online' }],
  [404, 'confirmada', { h: 160, origem: 'online' }],
  [405, 'pendente', { h: 8, origem: 'online' }],
  [406, 'aguardando_pagamento', { h: 7, prazoH: 17, origem: 'online' }],
  [407, 'lista_espera', { h: 6, origem: 'online' }],
  [408, 'lista_espera', { h: 3, origem: 'online' }],
];

const CAMISETAS_SEMENTE = ['M', 'G', 'BL M', 'P', 'GG', 'BL P'];
const CONTATOS = ['Maria', 'José', 'Cláudia', 'Antônio', 'Helena', 'Roberto'];

/**
 * @param {object} p { base, precos, agora (ms), novoId, novoToken }
 */
export function inscricoesDeSemente({ base, precos, agora, novoId, novoToken }) {
  const iso = (ms) => new Date(ms).toISOString();
  return INSCRICOES.map(([m, situacao, o], i) => {
    const c = base[String(m)];
    const criadoMs = agora - (o.h ?? 24) * 3_600_000 - i * 61_000;
    const temComprovante = ['pendente', 'confirmada', 'recusada'].includes(situacao) && (o.origem === 'online');
    const conv = o.conv
      ? {
          nome: convidadoDe(i),
          modalidade: i % 3 === 0 ? 'caminhada_4' : 'corrida_5_5',
          camiseta: CAMISETAS_SEMENTE[i % CAMISETAS_SEMENTE.length],
          situacao: o.conv,
          prazoPagamento: o.conv === 'aguardando_pagamento' ? iso(agora + (o.prazoConvH ?? 12) * 3_600_000) : null,
          valorDevido: ['aguardando_pagamento', 'pendente', 'confirmada'].includes(o.conv) ? precos.convidado : null,
          comprovante: o.conv === 'pendente' || (o.conv === 'confirmada' && o.origem === 'online') ? 'semente' : null,
          conferidoPor: o.conv === 'confirmada' ? 'organizacao' : null,
        }
      : null;
    const conferida = situacao === 'confirmada' || situacao === 'recusada';
    return {
      id: novoId(),
      codigo: 100 + i + 1,
      token: novoToken(),
      matricula: String(m),
      nome: c.nome,
      setor: c.setor ?? 'Apoio',
      grupoId: c.grupoId,
      telefone: telefoneDe(m),
      emergenciaNome: `${CONTATOS[i % CONTATOS.length]} ${c.nome.split(' ').slice(-1)[0]}`,
      emergenciaTel: telefoneDe(m + 500),
      modalidade: o.mod ?? 'corrida_5_5',
      convidado: conv,
      criancas: o.criancas ?? 0,
      autorizaImagem: o.origem === 'online' ? i % 4 !== 0 : null,
      valorDevido: precos.colaborador,
      situacao,
      motivo: o.motivo ?? null,
      origem: o.origem ?? 'balcao',
      registradoPor: o.origem === 'online' ? null : 'organizacao',
      conferidoPor: conferida ? 'organizacao' : null,
      conferidoEm: conferida ? iso(criadoMs + 5 * 3_600_000) : null,
      criadoEm: iso(criadoMs),
      prazoPagamento: situacao === 'aguardando_pagamento' ? iso(agora + (o.prazoH ?? 12) * 3_600_000) : null,
      comprovante: temComprovante ? 'semente' : null,
    };
  });
}

/** Um comprovante de Pix de mentira, em SVG, para a conferência mostrar. */
export function comprovanteFicticio({ codigo, nome, valor, quando, de = 'colaborador' }) {
  const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const linhas = [
    ['Valor', valor],
    ['Data', quando],
    ['De', nome],
    ['Para', 'Associação da Corrida (fictícia)'],
    ['Chave Pix', 'pix@exemplo.com.br'],
    ['Instituição', 'Banco Exemplo S.A.'],
    ['ID da transação', `E0000000020260000000000${String(codigo).padStart(4, '0')}`],
  ];
  const corpo = linhas
    .map(([r, v], i) => `<text x="40" y="${250 + i * 62}" font-size="20" fill="#5b6b5d">${esc(r)}</text><text x="40" y="${278 + i * 62}" font-size="24" font-weight="700" fill="#14261a">${esc(v)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">
<rect width="600" height="760" rx="24" fill="#f4f7f1"/>
<rect x="0" y="0" width="600" height="150" rx="24" fill="#1c4b2a"/><rect x="0" y="120" width="600" height="30" fill="#1c4b2a"/>
<text x="40" y="70" font-size="30" font-weight="800" fill="#eef5e8" font-family="sans-serif">Comprovante de Pix</text>
<text x="40" y="110" font-size="18" fill="#a9c4a4" font-family="sans-serif">${de === 'convidado' ? 'Convidado · ' : ''}inscrição nº ${esc(codigo)}</text>
<g font-family="sans-serif">${corpo}</g>
<rect x="40" y="690" width="520" height="40" rx="10" fill="#ffe08a"/>
<text x="300" y="717" font-size="18" font-weight="700" text-anchor="middle" fill="#14261a" font-family="sans-serif">DEMONSTRAÇÃO · documento fictício</text>
</svg>`;
}
