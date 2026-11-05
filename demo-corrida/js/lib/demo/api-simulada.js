// -----------------------------------------------------------------------------
// api-simulada.js — a API do sistema, simulada NO NAVEGADOR para a demonstração.
//
// fetchDemo(url, init) responde como o servidor real responderia (mesmas rotas,
// mesmos status, mesmas frases), sobre um estado em memória semeado com dados
// fictícios e guardado no sessionStorage da aba. Nada sai do navegador: o
// comprovante anexado fica só aqui, e o CSV é montado aqui.
//
// As regras são as de lib/regras.js — o mesmo módulo que o servidor espelha —
// e o fluxo segue o do servidor: conferência dos campos, trava de vagas por
// turno, lista de espera, reserva com prazo, chamada da fila e sorteio.
// -----------------------------------------------------------------------------
import {
  CAMISETAS, COLUNAS_IMPORTACAO, ERRO_CAMPO, LIMITE_EMERGENCIA_NOME, LIMITE_SETOR, MAX_COMPROVANTE_BYTES, MAX_GRUPO_ID,
  MAX_LINHAS_POR_LOTE, MODALIDADES, PRAZO_PAGAMENTO_HORAS, RECUSA, SITUACOES_QUE_OCUPAM, SITUACOES_VIVAS,
  criancasValidas, daProducao, formatarTelefone, matriculaValida, normalizarMatricula, normalizarNome, normalizarTelefone,
  telefoneValido, validarNome,
} from '../regras.js';
import { GRUPOS, LOGIN_DEMO, baseDeColaboradores, comprovanteFicticio, inscricoesDeSemente } from './semente.js';

const CHAVE = 'corrida.demo.estado.v1';
const SITUACOES = ['pendente', 'confirmada', 'aguardando_pagamento', 'lista_espera', 'recusada', 'cancelada', 'expirada'];
const HORA = 3_600_000;

// ---------------------------------------------------------------- utilidades

function novoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const x = [...b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
function novoToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const tokenValido = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t);
const aparar = (v) => (typeof v === 'string' ? v.trim() : '');
const inteiro = (n) => (typeof n === 'number' && Number.isInteger(n) ? n : null);
const entre = (s, min, max) => s.length >= min && s.length <= max;
const agoraIso = () => new Date().toISOString();
const somarHoras = (iso, h) => new Date(Date.parse(iso) + h * HORA).toISOString();
const ocupa = (s) => SITUACOES_QUE_OCUPAM.includes(s);
const minusculo = (s) => (s ?? '').normalize('NFC').toLocaleLowerCase('pt-BR');

// ---------------------------------------------------------------- estado

function semear() {
  const precos = { colaborador: 3000, convidado: 4000 };
  const base = baseDeColaboradores();
  const inscricoes = inscricoesDeSemente({ base, precos, agora: Date.now(), novoId, novoToken });
  return {
    versao: 1,
    contador: 100 + inscricoes.length,
    config: {
      precoColaborador: precos.colaborador,
      precoConvidado: precos.convidado,
      chavePix: 'pix@exemplo.com.br',
      textoPagamento: 'Banco Exemplo · agência 0000 · conta 00000-0 · Associação da Corrida (dados fictícios)',
      whatsapp: '(00) 00000-0000',
      canalEncarregado: 'privacidade@exemplo.com.br',
      inscricoesAbertas: true,
      inscricoesAte: null,
      pagamentoAte: null,
    },
    grupos: GRUPOS.map((g) => ({ id: g.id, nome: g.nome, cotaColaborador: g.cota, ativo: true, ordem: g.ordem })),
    colaboradores: base,
    inscricoes,
    log: [],
  };
}

function carregar() {
  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    if (bruto) {
      const d = JSON.parse(bruto);
      if (d && d.versao === 1) return d;
    }
  } catch {
    // aba privada, iframe sem armazenamento: o estado vive só na memória
  }
  return semear();
}

let db = carregar();
/** Os bytes dos comprovantes anexados nesta aba (não vão para o sessionStorage). */
const anexos = new Map();

function salvar() {
  try {
    window.sessionStorage.setItem(CHAVE, JSON.stringify(db));
  } catch {
    // sem armazenamento: segue na memória
  }
}

/** Volta a demonstração ao estado inicial (o botão "Recomeçar"). */
export function recomecarDemo() {
  try {
    window.sessionStorage.removeItem(CHAVE);
    window.localStorage.removeItem('corrida.ultima');
  } catch {
    // nada a limpar
  }
  db = semear();
  anexos.clear();
}

function log(inscricaoId, acao, autor, dados = null) {
  db.log.push({ inscricaoId, acao, autor, dados, em: agoraIso() });
  if (db.log.length > 500) db.log.splice(0, db.log.length - 500);
}

// ---------------------------------------------------------------- vagas (Vagas.php)

function config() {
  const c = db.config;
  return {
    precos: { colaborador: c.precoColaborador, convidado: c.precoConvidado },
    chavePix: c.chavePix,
    textoPagamento: c.textoPagamento,
    whatsapp: c.whatsapp,
    canalEncarregado: c.canalEncarregado,
    inscricoesAbertas: c.inscricoesAbertas,
    inscricoesAte: c.inscricoesAte,
    pagamentoAte: c.pagamentoAte,
    abertas: c.inscricoesAbertas && (c.inscricoesAte === null || Date.now() < Date.parse(c.inscricoesAte)),
  };
}

/** Até a data fixa da configuração, ela; depois dela (ou sem ela), 24 h. */
function prazoPagamento() {
  const fixa = db.config.pagamentoAte;
  return fixa !== null && Date.now() < Date.parse(fixa) ? fixa : somarHoras(agoraIso(), PRAZO_PAGAMENTO_HORAS);
}

const doGrupo = (gid) => db.inscricoes.filter((i) => i.grupoId === gid);
const ordemDaFila = (a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm) || a.codigo - b.codigo;

/** Vence prazos, chama a fila enquanto houver vaga e devolve a ocupação do turno. */
function ocupacao(gid) {
  const agora = Date.now();
  for (const i of doGrupo(gid)) {
    if (i.situacao === 'aguardando_pagamento' && Date.parse(i.prazoPagamento) <= agora) {
      i.situacao = 'expirada';
      if (i.convidado) i.convidado.situacao = 'expirada';
      log(i.id, 'expirada', 'sistema');
    }
    if (i.convidado?.situacao === 'aguardando_pagamento' && Date.parse(i.convidado.prazoPagamento) <= agora) {
      i.convidado.situacao = 'expirada';
      log(i.id, 'convidado_expirado', 'sistema');
    }
  }
  const g = db.grupos.find((x) => x.id === gid && x.ativo);
  let colaborador = 0;
  let convidado = 0;
  for (;;) {
    colaborador = doGrupo(gid).filter((i) => ocupa(i.situacao)).length;
    convidado = doGrupo(gid).filter((i) => i.convidado && ocupa(i.convidado.situacao)).length;
    if (!g || colaborador + convidado >= g.cotaColaborador) break;
    const proximo = doGrupo(gid).filter((i) => i.situacao === 'lista_espera').sort(ordemDaFila)[0];
    if (!proximo) break;
    proximo.situacao = 'aguardando_pagamento';
    proximo.prazoPagamento = prazoPagamento();
    log(proximo.id, 'vaga_aberta', 'sistema');
  }
  const fila = doGrupo(gid).filter((i) => i.situacao === 'lista_espera').length;
  return { colaborador, convidado, fila };
}

function comOcupacao(g) {
  if (!g) return null;
  const o = ocupacao(g.id);
  return {
    id: g.id, nome: g.nome, cotaColaborador: g.cotaColaborador, ativo: g.ativo,
    ocupadas: { colaborador: o.colaborador, convidado: o.convidado }, fila: o.fila,
  };
}

const grupos = () => db.grupos.filter((g) => g.ativo).sort((a, b) => a.ordem - b.ordem).map(comOcupacao);
const grupo = (id) => comOcupacao(db.grupos.find((g) => g.id === id));
const livres = (g) => Math.max(0, g.cotaColaborador - g.ocupadas.colaborador - g.ocupadas.convidado);
const acomodarTodos = () => db.grupos.filter((g) => g.ativo).forEach((g) => ocupacao(g.id));

function colaboradorDaBase(matricula) {
  const c = db.colaboradores[matricula];
  if (!c) return null;
  const g = db.grupos.find((x) => x.id === c.grupoId);
  return { nome: c.nome, grupoId: c.grupoId, grupoNome: g?.nome ?? '', setor: c.setor };
}

const inscricaoViva = (matricula) => db.inscricoes.find((i) => i.matricula === matricula && SITUACOES_VIVAS.includes(i.situacao)) ?? null;
const porId = (id) => db.inscricoes.find((i) => i.id === String(id).toLowerCase()) ?? null;

// ---------------------------------------------------------------- comprovante (Comprovante.php)

function deBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Confere o arquivo pelos primeiros bytes (PNG, JPEG, WebP, PDF) e pelo tamanho. */
function validarComprovante(b64) {
  if (typeof b64 !== 'string' || b64 === '') return { ok: false, erro: RECUSA.comprovante };
  let bytes;
  try {
    bytes = deBase64(b64);
  } catch {
    return { ok: false, erro: RECUSA.comprovante };
  }
  if (bytes.length === 0 || bytes.length > MAX_COMPROVANTE_BYTES) return { ok: false, erro: RECUSA.comprovante };
  const ini = (...xs) => xs.every((x, k) => bytes[k] === x);
  const ascii = (de, ate) => String.fromCharCode(...bytes.slice(de, ate));
  let tipo = null;
  if (ini(0x89, 0x50, 0x4e, 0x47)) tipo = 'image/png';
  else if (ini(0xff, 0xd8, 0xff)) tipo = 'image/jpeg';
  else if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') tipo = 'image/webp';
  else if (ascii(0, 5) === '%PDF-') tipo = 'application/pdf';
  if (!tipo) return { ok: false, erro: RECUSA.comprovante };
  return { ok: true, tipo, base64: b64 };
}

function guardarAnexo(conferido) {
  const chave = novoId();
  anexos.set(chave, { tipo: conferido.tipo, base64: conferido.base64 });
  return chave;
}

// ---------------------------------------------------------------- leitura (Leitura.php)

function lerInscricao(corpo, daBase) {
  const c = corpo && typeof corpo === 'object' && !Array.isArray(corpo) ? corpo : {};
  const falha = (erro) => ({ ok: false, erro });
  const E = ERRO_CAMPO;
  const grupoId = daBase ? daBase.grupoId : aparar(c.grupoId);
  if (!entre(grupoId, 1, MAX_GRUPO_ID)) return falha(E.grupo);
  if (!matriculaValida(aparar(c.matricula))) return falha(E.matricula);
  const nome = daBase ? daBase.nome : aparar(c.nome);
  const erroNome = daBase ? null : validarNome(nome);
  if (erroNome) return falha(erroNome);
  const setor = daBase?.setor ?? aparar(c.setor);
  if (!entre(setor, LIMITE_SETOR.min, LIMITE_SETOR.max)) return falha(E.setor);
  if (!telefoneValido(aparar(c.telefone))) return falha(E.telefone);
  const emergenciaNome = aparar(c.emergenciaNome);
  if (!entre(emergenciaNome, LIMITE_EMERGENCIA_NOME.min, LIMITE_EMERGENCIA_NOME.max) || !telefoneValido(aparar(c.emergenciaTel))) {
    return falha(E.emergencia);
  }
  if (!Object.hasOwn(MODALIDADES, c.modalidade ?? '')) return falha(E.modalidade);
  let convidado = null;
  if (c.convidado !== undefined && c.convidado !== null) {
    const v = c.convidado;
    if (typeof v !== 'object' || Array.isArray(v)) return falha(E.convidadoNome);
    const nc = aparar(v.nome);
    if (validarNome(nc)) return falha(E.convidadoNome);
    if (!Object.hasOwn(MODALIDADES, v.modalidade ?? '')) return falha(E.convidadoModalidade);
    if (!CAMISETAS.includes(v.camiseta)) return falha(E.convidadoCamiseta);
    convidado = { nome: normalizarNome(nc), modalidade: v.modalidade, camiseta: v.camiseta };
  }
  const criancas = c.criancas === undefined ? 0 : c.criancas;
  if (!criancasValidas(criancas)) return falha(E.criancasQtd);
  const comTermo = !daProducao(grupoId);
  if (comTermo) {
    if (c.aceiteSaude !== true) return falha(E.aceiteSaude);
    if (convidado && c.aceiteRespConv !== true) return falha(E.aceiteRespConv);
    if (c.aceiteLgpd !== true) return falha(E.aceiteLgpd);
    if (typeof c.autorizaImagem !== 'boolean') return falha(E.autorizaImagem);
  }
  return {
    ok: true,
    dados: {
      grupoId,
      matricula: normalizarMatricula(aparar(c.matricula)),
      nome: daBase ? nome : normalizarNome(nome),
      setor,
      telefone: normalizarTelefone(aparar(c.telefone)),
      emergenciaNome,
      emergenciaTel: normalizarTelefone(aparar(c.emergenciaTel)),
      modalidade: c.modalidade,
      convidado,
      criancas,
      comTermo,
      autorizaImagem: comTermo ? c.autorizaImagem : null,
    },
  };
}

// ---------------------------------------------------------------- inscrição (FluxoInscricao.php)

const recusa = (status, erro, motivo = null) => ({ status, corpo: motivo ? { erro, motivo } : { erro } });

function reenvioOuRecusa(viva, token) {
  if (viva && viva.token === token) {
    return { status: 200, corpo: { id: viva.id, codigo: viva.codigo, valorDevido: viva.valorDevido, situacao: viva.situacao, prazoPagamento: viva.prazoPagamento, token } };
  }
  return recusa(409, RECUSA.matricula, 'matricula');
}

/** origem: { tipo: 'online' } | { tipo: 'balcao', autor, via: 'balcao' | 'importacao' } */
function inscrever(corpo, origem) {
  const online = origem.tipo === 'online';
  const cfg = config();
  if (online && !cfg.abertas) return recusa(400, RECUSA.encerradas);
  const c = corpo && typeof corpo === 'object' && !Array.isArray(corpo) ? corpo : {};
  const matriculaDoCorpo = aparar(c.matricula);
  let daBase = null;
  if (online) {
    if (!matriculaValida(matriculaDoCorpo)) return recusa(400, ERRO_CAMPO.matricula);
    const base = colaboradorDaBase(normalizarMatricula(matriculaDoCorpo));
    if (!base) return recusa(400, RECUSA.foraDaBase);
    if (daProducao(base.grupoId)) return recusa(400, RECUSA.producaoNaMesa);
    daBase = { nome: base.nome, grupoId: base.grupoId, setor: base.setor };
  } else if (origem.via === 'balcao' && matriculaValida(matriculaDoCorpo)) {
    const base = colaboradorDaBase(normalizarMatricula(matriculaDoCorpo));
    if (base) daBase = { nome: base.nome, grupoId: base.grupoId, setor: base.setor };
  }
  const lido = lerInscricao(c, daBase);
  if (!lido.ok) return recusa(400, lido.erro);
  const dados = lido.dados;
  const token = tokenValido(c.token) ? c.token : novoToken();
  const anexo = c.comprovante ?? null;
  const conferido = anexo !== null ? validarComprovante(typeof anexo === 'object' ? anexo.base64 : null) : null;

  const g = grupo(dados.grupoId);
  if (!g || !g.ativo) return recusa(400, daBase ? RECUSA.grupoFechado : ERRO_CAMPO.grupo);
  const viva = inscricaoViva(dados.matricula);
  if (viva) return reenvioOuRecusa(viva, token);

  const listaEspera = c.listaEspera === true;
  const semVaga = livres(g) === 0;
  if (semVaga && !listaEspera) return recusa(409, RECUSA.colaborador, 'colaborador');

  let comprovante = null;
  if (!semVaga && conferido !== null) {
    if (!conferido.ok) return recusa(400, conferido.erro);
    comprovante = guardarAnexo(conferido);
  }
  const valor = cfg.precos.colaborador;
  const pagoNoBalcao = !online && c.pagoNoBalcao === true;
  const situacao = semVaga ? 'lista_espera' : pagoNoBalcao ? 'confirmada' : comprovante ? 'pendente' : 'aguardando_pagamento';
  const autor = online ? 'participante' : origem.autor;
  const agora = agoraIso();
  db.contador += 1;
  const i = {
    id: novoId(),
    codigo: db.contador,
    token,
    matricula: dados.matricula,
    nome: dados.nome,
    setor: dados.setor,
    grupoId: dados.grupoId,
    telefone: dados.telefone,
    emergenciaNome: dados.emergenciaNome,
    emergenciaTel: dados.emergenciaTel,
    modalidade: dados.modalidade,
    convidado: dados.convidado
      ? { ...dados.convidado, situacao: 'lista_espera', prazoPagamento: null, valorDevido: null, comprovante: null, conferidoPor: null }
      : null,
    criancas: dados.criancas,
    autorizaImagem: dados.autorizaImagem,
    valorDevido: valor,
    situacao,
    motivo: null,
    origem: online ? 'online' : 'balcao',
    registradoPor: online ? null : origem.autor,
    conferidoPor: situacao === 'confirmada' ? origem.autor : null,
    conferidoEm: situacao === 'confirmada' ? agora : null,
    criadoEm: agora,
    prazoPagamento: situacao === 'aguardando_pagamento' ? prazoPagamento() : null,
    comprovante: situacao !== 'lista_espera' ? comprovante : null,
  };
  db.inscricoes.push(i);
  log(i.id, situacao === 'lista_espera' ? 'lista_espera' : 'inscrita', autor, { via: online ? 'online' : origem.via, grupo: dados.grupoId, situacao });
  return { status: 201, corpo: { id: i.id, codigo: i.codigo, valorDevido: valor, situacao, prazoPagamento: i.prazoPagamento, token } };
}

// ---------------------------------------------------------------- rotas públicas

const NAO_ENCONTRADA = { erro: 'Inscrição não encontrada. Confira o link.' };

function vagas() {
  const cfg = config();
  return {
    status: 200,
    corpo: {
      grupos: grupos().map((g) => {
        const l = livres(g);
        return { id: g.id, nome: g.nome, livresColaborador: l, vagas: g.cotaColaborador, esgotado: l === 0 };
      }),
      precos: cfg.precos,
      pix: { chave: cfg.chavePix, texto: cfg.textoPagamento },
      whatsapp: cfg.whatsapp,
      canalEncarregado: cfg.canalEncarregado,
      abertas: cfg.abertas,
      pagamentoAte: cfg.pagamentoAte,
    },
  };
}

function colaboradorPublico(corpo) {
  if (!config().abertas) return { status: 400, corpo: { erro: RECUSA.encerradas } };
  const m = aparar(corpo?.matricula);
  if (!matriculaValida(m)) return { status: 400, corpo: { erro: ERRO_CAMPO.matricula } };
  const n = normalizarMatricula(m);
  const c = colaboradorDaBase(n);
  if (!c) return { status: 404, corpo: { erro: RECUSA.foraDaBase } };
  if (daProducao(c.grupoId)) return { status: 403, corpo: { erro: RECUSA.producaoNaMesa } };
  if (inscricaoViva(n)) return { status: 409, corpo: { erro: RECUSA.matricula, jaInscrita: true } };
  return { status: 200, corpo: c };
}

function acompanhar(id, t) {
  const i = porId(id);
  if (!i || !tokenValido(t) || i.token !== t) return { status: 404, corpo: NAO_ENCONTRADA };
  ocupacao(i.grupoId);
  const g = db.grupos.find((x) => x.id === i.grupoId);
  const posicaoNaFila = i.situacao === 'lista_espera'
    ? doGrupo(i.grupoId).filter((f) => f.situacao === 'lista_espera' && ordemDaFila(f, i) < 0).length + 1
    : null;
  const cv = i.convidado;
  return {
    status: 200,
    corpo: {
      codigo: i.codigo, situacao: i.situacao, valorDevido: i.valorDevido, motivo: i.motivo, nome: i.nome, grupo: g?.nome ?? '',
      modalidade: i.modalidade, criancas: i.criancas, criadoEm: i.criadoEm,
      prazoPagamento: i.situacao === 'aguardando_pagamento' ? i.prazoPagamento : null,
      posicaoNaFila,
      convidado: cv
        ? { nome: cv.nome, modalidade: cv.modalidade, situacao: cv.situacao, prazoPagamento: cv.situacao === 'aguardando_pagamento' ? cv.prazoPagamento : null, valorDevido: cv.valorDevido }
        : null,
    },
  };
}

const RECUSA_DO_CONVIDADO = {
  expirada: 'O prazo para pagar o convidado terminou. Fale com a organização.',
  pendente: 'O comprovante do convidado já foi enviado.',
  confirmada: 'O comprovante do convidado já foi enviado.',
  lista_espera: 'O seu convidado ainda está na lista de espera: o pagamento abre se ele for sorteado.',
};
const RECUSA_DO_COMPROVANTE = {
  expirada: RECUSA.prazo,
  pendente: 'O comprovante desta inscrição já foi enviado.',
  confirmada: 'O comprovante desta inscrição já foi enviado.',
  lista_espera: 'Você ainda está na lista de espera: o pagamento abre quando chegar a sua vez.',
};

function enviarComprovante(id, t, corpo, de) {
  const i = porId(id);
  if (!i || !tokenValido(t) || i.token !== t) return { status: 404, corpo: NAO_ENCONTRADA };
  const v = validarComprovante(corpo?.comprovante?.base64);
  if (!v.ok) return { status: 400, corpo: { erro: v.erro } };
  ocupacao(i.grupoId);
  const alvo = de === 'convidado' ? i.convidado : i;
  if (!alvo) return { status: 409, corpo: { erro: 'Esta inscrição não tem convidado.' } };
  if (alvo.situacao !== 'aguardando_pagamento' || Date.parse(alvo.prazoPagamento) <= Date.now()) {
    const recusas = de === 'convidado' ? RECUSA_DO_CONVIDADO : RECUSA_DO_COMPROVANTE;
    return { status: 409, corpo: { erro: recusas[alvo.situacao] ?? 'Esta inscrição não aceita comprovante agora. Fale com a organização.' } };
  }
  alvo.situacao = 'pendente';
  alvo.comprovante = guardarAnexo(v);
  log(i.id, de === 'convidado' ? 'comprovante_convidado_enviado' : 'comprovante_enviado', 'participante');
  return { status: 200, corpo: { situacao: 'pendente' } };
}

// ---------------------------------------------------------------- mesa da organização

function painel() {
  // "hoje" é o dia de São Paulo (UTC−3, sem horário de verão)
  const hojeSp = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const fim = Date.parse(`${hojeSp}T00:00:00-03:00`) + 24 * HORA;
  const inicio = fim - 24 * HORA;
  const gs = grupos();
  const xs = db.inscricoes;
  const soma = (f) => xs.reduce((n, i) => n + (f(i) ? 1 : 0), 0);
  const total = (f) => xs.reduce((n, i) => n + (f(i) ?? 0), 0);
  const cs = (i) => i.convidado?.situacao ?? null;
  return {
    status: 200,
    corpo: {
      grupos: gs.map((g) => {
        const d = doGrupo(g.id);
        return {
          id: g.id, nome: g.nome, cotaColaborador: g.cotaColaborador,
          ocupadasColaborador: g.ocupadas.colaborador, ocupadasConvidado: g.ocupadas.convidado, fila: g.fila,
          confirmadas: d.filter((i) => i.situacao === 'confirmada').length,
          andamento: d.filter((i) => ['pendente', 'aguardando_pagamento'].includes(i.situacao)).length,
          sorteaveis: d.filter((i) => cs(i) === 'lista_espera' && i.situacao === 'confirmada').length,
        };
      }),
      pendentes: soma((i) => i.situacao === 'pendente'),
      convidadosParaConferir: soma((i) => cs(i) === 'pendente'),
      confirmadas: soma((i) => i.situacao === 'confirmada'),
      aguardandoPagamento: soma((i) => i.situacao === 'aguardando_pagamento'),
      venceHoje: soma((i) => (i.situacao === 'aguardando_pagamento' && Date.parse(i.prazoPagamento) < fim)
        || (cs(i) === 'aguardando_pagamento' && Date.parse(i.convidado.prazoPagamento) < fim)),
      listaEspera: soma((i) => i.situacao === 'lista_espera'),
      convidadosNaFila: soma((i) => cs(i) === 'lista_espera' && SITUACOES_VIVAS.includes(i.situacao)),
      hoje: soma((i) => Date.parse(i.criadoEm) >= inicio),
      aReceber: total((i) => (['pendente', 'aguardando_pagamento'].includes(i.situacao) ? i.valorDevido : 0))
        + total((i) => (['pendente', 'aguardando_pagamento'].includes(cs(i)) ? i.convidado.valorDevido : 0)),
      recebido: total((i) => (i.situacao === 'confirmada' ? i.valorDevido : 0))
        + total((i) => (cs(i) === 'confirmada' ? i.convidado.valorDevido : 0)),
      criancas: total((i) => (ocupa(i.situacao) ? i.criancas : 0)),
    },
  };
}

function colaboradorNaMesa(corpo) {
  const m = aparar(corpo?.matricula);
  if (!matriculaValida(m)) return { status: 400, corpo: { erro: ERRO_CAMPO.matricula } };
  const n = normalizarMatricula(m);
  const c = colaboradorDaBase(n);
  if (!c) return { status: 404, corpo: { erro: 'Esta matrícula não está na base de colaboradores. Confira o número ou siga escolhendo o turno.' } };
  const viva = inscricaoViva(n);
  if (viva) return { status: 409, corpo: { erro: `Esta matrícula já tem a inscrição nº ${viva.codigo}. Procure em Inscritos.`, jaInscrita: true } };
  return { status: 200, corpo: c };
}

function linhaDaLista(i) {
  const g = db.grupos.find((x) => x.id === i.grupoId);
  const cv = i.convidado;
  return {
    id: i.id, codigo: i.codigo, nome: i.nome, matricula: i.matricula, setor: i.setor, grupoId: i.grupoId, grupoNome: g?.nome ?? '',
    telefone: i.telefone, emergenciaNome: i.emergenciaNome, emergenciaTel: i.emergenciaTel, modalidade: i.modalidade,
    autorizaImagem: i.autorizaImagem, valorDevido: i.valorDevido, situacao: i.situacao, motivo: i.motivo, origem: i.origem,
    registradoPor: i.registradoPor, conferidoPor: i.conferidoPor, conferidoEm: i.conferidoEm, criadoEm: i.criadoEm,
    prazoPagamento: i.prazoPagamento, temComprovante: i.comprovante !== null, criancas: i.criancas,
    convidado: cv
      ? { nome: cv.nome, modalidade: cv.modalidade, camiseta: cv.camiseta, situacao: cv.situacao, prazoPagamento: cv.prazoPagamento, valorDevido: cv.valorDevido, temComprovante: cv.comprovante !== null }
      : null,
  };
}

function listaDaMesa(q) {
  const texto = (v, max) => (v !== null && aparar(v) !== '' ? aparar(v).slice(0, max) : null);
  const grupoF = texto(q.get('grupo'), 40);
  let situacao = texto(q.get('situacao'), 20);
  situacao = situacao !== null && SITUACOES.includes(situacao) ? situacao : null;
  const busca = texto(q.get('busca'), 80);
  const matricula = busca !== null && /^\d+$/.test(busca) ? normalizarMatricula(busca) : null;
  const conv = ['fila', 'conferir', 'reserva'].includes(q.get('convidados')) ? q.get('convidados') : null;
  acomodarTodos();
  const linhas = db.inscricoes
    .filter((i) => grupoF === null || i.grupoId === grupoF)
    .filter((i) => situacao === null || i.situacao === situacao)
    .filter((i) => busca === null
      || minusculo(i.nome).includes(minusculo(busca))
      || minusculo(i.convidado?.nome ?? '').includes(minusculo(busca))
      || String(i.codigo) === busca
      || i.matricula === matricula)
    .filter((i) => {
      const cs = i.convidado?.situacao ?? null;
      return conv === null
        || (conv === 'fila' && cs === 'lista_espera' && SITUACOES_VIVAS.includes(i.situacao))
        || (conv === 'conferir' && cs === 'pendente')
        || (conv === 'reserva' && cs === 'aguardando_pagamento');
    })
    .sort(ordemDaFila)
    .slice(0, 2000)
    .map(linhaDaLista);
  return { status: 200, corpo: { inscricoes: linhas } };
}

function motivoDe(corpo) {
  const t = aparar(corpo?.motivo).slice(0, 300);
  return t.length >= 3 ? t : null;
}

function conferir(id, corpo, doConvidado) {
  const decisao = corpo?.decisao;
  if (decisao !== 'confirmada' && decisao !== 'recusada') return { status: 400, corpo: { erro: 'Decisão inválida.' } };
  const motivo = decisao === 'recusada' ? motivoDe(corpo) : null;
  if (decisao === 'recusada' && motivo === null) return { status: 400, corpo: { erro: 'Informe o motivo da recusa.' } };
  const i = porId(id);
  if (!i) return { status: 404, corpo: { erro: 'Inscrição não encontrada.' } };
  const alvo = doConvidado ? i.convidado : i;
  const pode = alvo && (alvo.situacao === 'pendente' || (decisao === 'confirmada' && alvo.situacao === 'aguardando_pagamento'));
  if (!pode) {
    return {
      status: 409,
      corpo: { erro: doConvidado ? 'O convidado desta inscrição já foi conferido ou não está pendente.' : 'Esta inscrição já foi conferida ou não está mais pendente.' },
    };
  }
  alvo.situacao = decisao;
  alvo.motivo = motivo;
  alvo.conferidoPor = LOGIN_DEMO.login;
  alvo.conferidoEm = agoraIso();
  // recusada, o convidado sai junto; confirmar não mexe nele
  if (!doConvidado && decisao === 'recusada' && i.convidado) i.convidado.situacao = 'recusada';
  log(i.id, (doConvidado ? 'convidado_' : '') + decisao, LOGIN_DEMO.login, { motivo });
  if (decisao === 'recusada') ocupacao(i.grupoId);
  return { status: 200, corpo: { situacao: decisao } };
}

function cancelar(id, corpo) {
  const motivo = motivoDe(corpo);
  const inclui = corpo?.incluiConvidado === true;
  if (motivo === null) return { status: 400, corpo: { erro: 'Informe o motivo do cancelamento.' } };
  const i = porId(id);
  if (!i) return { status: 404, corpo: { erro: 'Inscrição não encontrada.' } };
  if (!SITUACOES_VIVAS.includes(i.situacao)) return { status: 409, corpo: { erro: 'Esta inscrição já não ocupa vaga.' } };
  const cs = i.convidado?.situacao ?? null;
  if (!inclui && cs !== null && ocupa(cs)) {
    return {
      status: 409,
      corpo: {
        erro: 'Esta inscrição tem um convidado sorteado (reservado, pendente ou pago): cancelar leva o convidado junto. Confirme para seguir.',
        convidadoSorteado: true,
      },
    };
  }
  i.situacao = 'cancelada';
  i.motivo = motivo;
  if (i.convidado) i.convidado.situacao = 'cancelada';
  log(i.id, 'cancelada', LOGIN_DEMO.login, { motivo, com_convidado: inclui });
  ocupacao(i.grupoId);
  return { status: 200, corpo: { situacao: 'cancelada' } };
}

function comprovanteDaMesa(id, de) {
  const i = porId(id);
  const alvo = de === 'convidado' ? i?.convidado : i;
  if (!alvo || !alvo.comprovante) return { status: 404, corpo: { erro: 'Sem comprovante.' } };
  log(i.id, de === 'convidado' ? 'comprovante_convidado_aberto' : 'comprovante_aberto', LOGIN_DEMO.login);
  const anexo = anexos.get(alvo.comprovante);
  if (anexo) return { status: 200, blob: new Blob([deBase64(anexo.base64)], { type: anexo.tipo }) };
  // comprovante da semente (ou anexado antes de recarregar a aba): um recibo fictício
  const valor = de === 'convidado' ? alvo.valorDevido ?? db.config.precoConvidado : i.valorDevido;
  const svg = comprovanteFicticio({
    codigo: i.codigo,
    nome: de === 'convidado' ? alvo.nome : i.nome,
    valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor / 100),
    quando: new Date(i.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    de,
  });
  return { status: 200, blob: new Blob([svg], { type: 'image/svg+xml' }) };
}

function cotas(id, corpo) {
  const cota = inteiro(corpo?.cotaColaborador);
  if (cota === null || cota < 0 || cota > 2000) return { status: 400, corpo: { erro: 'Cota inválida.' } };
  const g = db.grupos.find((x) => x.id === id);
  if (!g) return { status: 404, corpo: { erro: 'Grupo não encontrado.' } };
  const o = ocupacao(id);
  const ocupadas = o.colaborador + o.convidado;
  if (ocupadas > cota) return { status: 400, corpo: { erro: `Já há ${ocupadas} vagas ocupadas neste turno.` } };
  g.cotaColaborador = cota;
  log(null, 'cota_alterada', LOGIN_DEMO.login, { grupo: id, vagas: cota });
  ocupacao(id); // cota maior chama a fila
  return { status: 200, corpo: { id, cotaColaborador: cota } };
}

function sortear(id, corpo) {
  const quantidade = inteiro(corpo?.quantidade);
  if (quantidade === null || quantidade < 1 || quantidade > 300) return { status: 400, corpo: { erro: 'Quantos convidados sortear? De 1 a 300.' } };
  const g = grupo(id);
  if (!g || !g.ativo) return { status: 404, corpo: { erro: 'Turno não encontrado.' } };
  if (g.fila > 0) {
    const um = g.fila === 1;
    return { status: 409, corpo: { erro: `Há ${g.fila} ${um ? 'colaborador' : 'colaboradores'} na fila deste turno: a vaga é ${um ? 'dele' : 'deles'} primeiro.` } };
  }
  const l = livres(g);
  if (l === 0) return { status: 409, corpo: { erro: 'Não há vaga livre neste turno.' } };
  const elegiveis = doGrupo(id).filter((i) => i.convidado?.situacao === 'lista_espera' && i.situacao === 'confirmada');
  if (elegiveis.length === 0) return { status: 409, corpo: { erro: 'Não há convidado na lista de espera deste turno com o colaborador inscrito.' } };
  const embaralhados = [...elegiveis].sort(() => Math.random() - 0.5).slice(0, Math.min(l, quantidade));
  const prazo = prazoPagamento();
  for (const e of embaralhados) {
    e.convidado.situacao = 'aguardando_pagamento';
    e.convidado.prazoPagamento = prazo;
    e.convidado.valorDevido = db.config.precoConvidado;
    log(e.id, 'convidado_sorteado', LOGIN_DEMO.login, { grupo: id, elegiveis: elegiveis.length });
  }
  return { status: 200, corpo: { sorteados: embaralhados.map((e) => e.codigo).sort((a, b) => a - b), elegiveis: elegiveis.length, livres: l } };
}

const CAMPOS_TRAVADOS = ['precoColaborador', 'precoConvidado', 'chavePix', 'textoPagamento', 'whatsapp', 'canalEncarregado'];

function salvarConfig(c) {
  const corpo = c && typeof c === 'object' ? c : {};
  if (CAMPOS_TRAVADOS.some((k) => Object.hasOwn(corpo, k))) {
    return { status: 403, corpo: { erro: 'Preços e dados do Pix estão travados: não mudam pela mesa.' } };
  }
  const mudar = {};
  if (Object.hasOwn(corpo, 'inscricoesAbertas')) {
    if (typeof corpo.inscricoesAbertas !== 'boolean') return { status: 400, corpo: { erro: 'Valor inválido para "inscrições abertas".' } };
    mudar.inscricoesAbertas = corpo.inscricoesAbertas;
  }
  for (const k of ['inscricoesAte', 'pagamentoAte']) {
    if (!Object.hasOwn(corpo, k)) continue;
    const v = corpo[k];
    const ms = typeof v === 'string' ? Date.parse(v) : NaN;
    if (v !== null && Number.isNaN(ms)) return { status: 400, corpo: { erro: 'Data inválida.' } };
    mudar[k] = v === null ? null : new Date(ms).toISOString();
  }
  Object.assign(db.config, mudar);
  log(null, 'config_alterada', LOGIN_DEMO.login, { campos: Object.keys(mudar) });
  return { status: 200, corpo: config() };
}

// ------------------------------------------------- CSV (Csv.php, Exportacao.php, Importacao.php)

function celula(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') return String(v);
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}
const montarCsv = (cabecalho, linhas) => `﻿${[cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n')}\r\n`;

function lerCsv(texto) {
  const t = texto.startsWith('﻿') ? texto.slice(1) : texto;
  const primeira = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = primeira.includes(';') ? ';' : ',';
  const linhas = [];
  let linha = [];
  let cel = '';
  let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') {
        cel += '"';
        i++;
      } else if (c === '"') aspas = false;
      else cel += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(cel);
      cel = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(cel);
      linhas.push(linha);
      linha = [];
      cel = '';
    } else cel += c;
  }
  if (cel !== '' || linha.length) {
    linha.push(cel);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ''));
}

const rotuloSituacao = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function exportar(lista) {
  if (lista !== 'kits' && lista !== 'emergencia') return { status: 400, corpo: { erro: 'Lista inválida.' } };
  const xs = db.inscricoes.filter((i) => ocupa(i.situacao)).sort((a, b) => a.codigo - b.codigo);
  log(null, 'exportada', LOGIN_DEMO.login, { lista, linhas: xs.length });
  const nomeGrupo = (i) => db.grupos.find((g) => g.id === i.grupoId)?.nome ?? '';
  const imagem = (i) => (i.autorizaImagem === null ? 'Não perguntado' : i.autorizaImagem);
  let csv;
  if (lista === 'kits') {
    const linhas = [];
    for (const i of xs) {
      linhas.push([i.codigo, 'Colaborador', i.nome, nomeGrupo(i), MODALIDADES[i.modalidade], null, rotuloSituacao(i.situacao), imagem(i)]);
      const c = i.convidado;
      if (c && ocupa(c.situacao)) {
        linhas.push([i.codigo, 'Convidado', c.nome, nomeGrupo(i), MODALIDADES[c.modalidade], c.camiseta, rotuloSituacao(c.situacao), imagem(i)]);
      }
    }
    csv = montarCsv(['Código', 'Tipo', 'Nome', 'Grupo', 'Modalidade', 'Camiseta', 'Situação', 'Uso de imagem'], linhas);
  } else {
    csv = montarCsv(
      ['Código', 'Nome', 'Grupo', 'Telefone', 'Contato de emergência', 'Telefone de emergência', 'Convidado', 'Crianças'],
      xs.map((i) => [i.codigo, i.nome, nomeGrupo(i), formatarTelefone(i.telefone), i.emergenciaNome, formatarTelefone(i.emergenciaTel),
        i.convidado && ocupa(i.convidado.situacao) ? i.convidado.nome : null, i.criancas]),
    );
  }
  return { status: 200, blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }) };
}

function modalidadeDaPlanilha(v) {
  const m = v.toLocaleLowerCase('pt-BR');
  if (m === 'corrida' || m === 'corrida_5_5') return 'corrida_5_5';
  if (m === 'caminhada' || m === 'caminhada_4') return 'caminhada_4';
  return v;
}
function simNao(v) {
  const s = v.toLocaleLowerCase('pt-BR');
  if (['sim', 's', 'true'].includes(s)) return true;
  if (['não', 'nao', 'n', 'false'].includes(s)) return false;
  return null;
}

function importar(corpo) {
  if (corpo?.termosAceitos !== true) {
    return { status: 400, corpo: { erro: 'Confirme que as pessoas da planilha aceitaram os termos de saúde e LGPD na inscrição original.' } };
  }
  const linhas = typeof corpo.csv === 'string' ? lerCsv(corpo.csv) : [];
  const cabecalhoOk = linhas[0]
    && linhas[0].length === COLUNAS_IMPORTACAO.length
    && linhas[0].every((c, i) => c.trim().toLocaleLowerCase('pt-BR') === COLUNAS_IMPORTACAO[i]);
  if (!cabecalhoOk) return { status: 400, corpo: { erro: 'A planilha precisa ter o cabeçalho do modelo.' } };
  const dados = linhas.slice(1);
  const aPartirDe = inteiro(corpo.aPartirDe);
  const inicio = aPartirDe !== null && aPartirDe >= 0 ? aPartirDe : 0;
  const lote = dados.slice(inicio, inicio + MAX_LINHAS_POR_LOTE);
  const resultado = lote.map((valores, k) => {
    const v = Object.fromEntries(COLUNAS_IMPORTACAO.map((col, i) => [col, (valores[i] ?? '').trim()]));
    const convidado = v.conv_nome !== ''
      ? { nome: v.conv_nome, modalidade: modalidadeDaPlanilha(v.conv_modalidade), camiseta: v.conv_camiseta.toLocaleUpperCase('pt-BR').replace(/\s+/g, ' ').trim() }
      : null;
    const saida = inscrever({
      grupoId: v.grupo, matricula: v.matricula, nome: v.nome, setor: v.setor, telefone: v.telefone,
      emergenciaNome: v.emergencia_nome, emergenciaTel: v.emergencia_tel, modalidade: modalidadeDaPlanilha(v.modalidade),
      convidado, criancas: 0, aceiteSaude: true, aceiteLgpd: true, aceiteRespConv: convidado !== null,
      autorizaImagem: simNao(v.autoriza_imagem), comprovante: null, pagoNoBalcao: simNao(v.pago) === true,
    }, { tipo: 'balcao', autor: LOGIN_DEMO.login, via: 'importacao' });
    const linha = inicio + k + 2;
    return saida.corpo.codigo !== undefined ? { linha, ok: true, codigo: saida.corpo.codigo } : { linha, ok: false, erro: saida.corpo.erro };
  });
  const fim = inicio + lote.length;
  return { status: 200, corpo: { linhas: resultado, proxima: fim < dados.length ? fim : null, total: dados.length } };
}

// ---------------------------------------------------------------- roteador (Rotas.php)

const naoPermitido = { status: 405, corpo: { erro: 'Método não permitido.' } };

function resolver(metodo, caminho, q, corpo) {
  const s = caminho.replace(/^\/?api\/?/, '').replace(/\/+$/, '').split('/').map(decodeURIComponent);
  const [a, b, c, d] = s;
  if (a === 'vagas' && s.length === 1) return metodo === 'GET' ? vagas() : naoPermitido;
  if (a === 'colaborador' && s.length === 1) return metodo === 'POST' ? colaboradorPublico(corpo) : naoPermitido;
  if (a === 'inscricoes') {
    if (s.length === 1) return metodo === 'POST' ? inscrever(corpo, { tipo: 'online' }) : naoPermitido;
    if (s.length === 2) return metodo === 'GET' ? acompanhar(b, q.get('t')) : naoPermitido;
    if (s.length === 3 && (c === 'comprovante' || c === 'comprovante-convidado') && metodo === 'POST') {
      return enviarComprovante(b, q.get('t'), corpo, c === 'comprovante' ? 'colaborador' : 'convidado');
    }
  }
  if (a === 'org') {
    if (b === 'sessao') {
      if (metodo === 'DELETE') return { status: 204 };
      if (metodo === 'POST') {
        // demonstração: qualquer login e senha não vazios entram (não há conta real)
        return aparar(corpo?.login) && typeof corpo?.senha === 'string' && corpo.senha !== ''
          ? { status: 200, corpo: LOGIN_DEMO }
          : { status: 401, corpo: { erro: 'Login ou senha incorretos.' } };
      }
      return { status: 200, corpo: LOGIN_DEMO };
    }
    if (b === 'painel') return painel();
    if (b === 'colaborador') return colaboradorNaMesa(corpo);
    if (b === 'config') return metodo === 'PATCH' ? salvarConfig(corpo) : { status: 200, corpo: config() };
    if (b === 'exportar.csv') return exportar(q.get('lista') ?? 'kits');
    if (b === 'inscricoes' && s.length === 2) {
      return metodo === 'POST' ? inscrever(corpo, { tipo: 'balcao', autor: LOGIN_DEMO.login, via: 'balcao' }) : listaDaMesa(q);
    }
    if (b === 'inscricoes' && c === 'importar') return importar(corpo);
    if (b === 'inscricoes' && s.length === 4) {
      if (d === 'conferir') return conferir(c, corpo, false);
      if (d === 'conferir-convidado') return conferir(c, corpo, true);
      if (d === 'cancelar') return cancelar(c, corpo);
      if (d === 'comprovante') return comprovanteDaMesa(c, 'colaborador');
      if (d === 'comprovante-convidado') return comprovanteDaMesa(c, 'convidado');
    }
    if (b === 'grupos' && s.length === 3) return cotas(c, corpo);
    if (b === 'grupos' && s[3] === 'sorteio') return sortear(c, corpo);
  }
  return { status: 404, corpo: { erro: 'Rota de API não encontrada.' } };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** O fetch da demonstração: mesma assinatura do fetch, responde daqui mesmo. */
export async function fetchDemo(url, init = {}) {
  const u = new URL(url, 'http://api.demo');
  const metodo = (init.method ?? 'GET').toUpperCase();
  let corpo = null;
  if (typeof init.body === 'string') {
    try {
      corpo = JSON.parse(init.body);
    } catch {
      corpo = null;
    }
  }
  // uma latência pequena, para os estados "Enviando…" aparecerem como no real
  await espera(metodo === 'GET' ? 120 : 260);
  let r;
  try {
    r = resolver(metodo, u.pathname, u.searchParams, corpo);
  } catch (e) {
    console.error('[demo] erro na API simulada', e);
    r = { status: 500, corpo: { erro: 'Algo deu errado. Tente de novo.' } };
  }
  salvar();
  if (r.status === 204) return new Response(null, { status: 204 });
  if (r.blob) return new Response(r.blob, { status: r.status, headers: { 'Content-Type': r.blob.type } });
  return new Response(JSON.stringify(r.corpo), { status: r.status, headers: { 'Content-Type': 'application/json' } });
}
