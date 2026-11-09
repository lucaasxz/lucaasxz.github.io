// A cena da abertura, em 2D e sem bibliotecas: um corredor de traços simples
// numa pista que rola para trás; ao comemorar, ele desacelera, para, levanta um
// troféu e cai confete. Carregada à parte (import dinâmico). Quem pede menos
// movimento vê só o quadro final, parado.

const COR = {
  pista: '#1a4a28',
  raia: '#1f5530',
  linha: 'rgba(238,245,232,.55)',
  marca: '#9bc53d',
  corpo: '#eef5e8',
  camisa: '#9bc53d',
  trofeu: '#f2c14e',
  sombra: 'rgba(0,0,0,.28)',
};
const CONFETE = ['#9bc53d', '#eef5e8', '#f2c14e', '#ffe08a', '#a9c4a4'];
const suave = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const mistura = (a, b, k) => a + (b - a) * k;

export function montarCena(canvas, opcoes = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Sem canvas 2D.');
  const reduzido = Boolean(opcoes.reduzido);
  let largura = 0;
  let altura = 0;
  let dpr = 1;
  let quadro = 0;
  let vivo = true;
  let fase = 0; // o ciclo da passada
  let rolagem = 0; // o deslocamento da pista
  let velocidade = 1;
  let comemoracaoT0 = reduzido ? -1e9 : null;
  let ultimo = performance.now();
  const confete = [];

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = canvas.clientWidth || window.innerWidth;
    altura = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  window.addEventListener('resize', medir);

  const chao = () => altura * 0.6;
  const escala = () => Math.min(altura * 0.07, largura * 0.11);

  function desenharPista() {
    const y0 = chao();
    const s = escala();
    const topo = y0 - s * 0.35;
    const fundo = y0 + s * 2.4;
    ctx.fillStyle = COR.pista;
    ctx.fillRect(0, topo, largura, fundo - topo);
    const raias = 4;
    const alt = (fundo - topo) / raias;
    for (let i = 0; i < raias; i++) {
      if (i % 2) {
        ctx.fillStyle = COR.raia;
        ctx.fillRect(0, topo + i * alt, largura, alt);
      }
    }
    ctx.fillStyle = COR.linha;
    for (let i = 0; i <= raias; i++) ctx.fillRect(0, topo + i * alt - 1, largura, 2);
    // as marcas tracejadas rolam para trás
    ctx.fillStyle = COR.marca;
    const passo = s * 2.2;
    const desloc = -(rolagem % passo);
    for (let x = desloc - passo; x < largura + passo; x += passo) {
      ctx.fillRect(x, topo + alt * 1.5 - 2, s * 1.1, 4);
      ctx.fillRect(x + passo / 2, topo + alt * 3.2 - 2, s * 0.8, 3);
    }
    // a sombra do corredor
    ctx.fillStyle = COR.sombra;
    ctx.beginPath();
    ctx.ellipse(largura / 2, y0 + s * 0.05, s * 0.9, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** ângulo medido da vertical para baixo, positivo para a frente (direita) */
  const ponta = (p, ang, comp) => ({ x: p.x + Math.sin(ang) * comp, y: p.y + Math.cos(ang) * comp });

  function traco(a, b, cor, espessura) {
    ctx.strokeStyle = cor;
    ctx.lineWidth = espessura;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function desenharTrofeu(cx, cy, s) {
    ctx.fillStyle = COR.trofeu;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.42, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.42, cy - s * 0.5);
    ctx.quadraticCurveTo(cx + s * 0.4, cy + s * 0.1, cx, cy + s * 0.18);
    ctx.quadraticCurveTo(cx - s * 0.4, cy + s * 0.1, cx - s * 0.42, cy - s * 0.5);
    ctx.fill();
    ctx.fillRect(cx - s * 0.06, cy + s * 0.15, s * 0.12, s * 0.22);
    ctx.fillRect(cx - s * 0.26, cy + s * 0.34, s * 0.52, s * 0.1);
    ctx.strokeStyle = COR.trofeu;
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.arc(cx - s * 0.42, cy - s * 0.3, s * 0.16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.42, cy - s * 0.3, s * 0.16, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
  }

  function desenharCorredor(k) {
    // k: 0 correndo, 1 parado com o troféu no alto
    const s = escala();
    const L1 = s * 0.95;
    const L2 = s * 0.95;
    const T = s * 1.25;
    const A1 = s * 0.7;
    const A2 = s * 0.65;
    const r = s * 0.32;
    const esp = s * 0.2;
    const bob = Math.abs(Math.sin(fase)) * s * 0.1 * (1 - k);
    const cx = largura / 2;
    const quadril = { x: cx, y: chao() - (L1 + L2) * mistura(0.9, 0.99, k) - bob };
    const inclinacao = mistura(0.2, 0, k);
    const ombro = { x: quadril.x + Math.sin(inclinacao) * T, y: quadril.y - Math.cos(inclinacao) * T };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const perna = (desloc, cor) => {
      const ph = fase + desloc;
      const coxa = mistura(Math.sin(ph) * 0.8, desloc ? -0.1 : 0.1, k);
      const dobra = mistura(0.25 + 1.0 * Math.max(0, -Math.cos(ph)), 0, k);
      const joelho = ponta(quadril, coxa, L1);
      const pe = ponta(joelho, coxa - dobra, L2);
      traco(quadril, joelho, cor, esp);
      traco(joelho, pe, cor, esp);
    };
    const braco = (desloc, cor, lado) => {
      const ph = fase + desloc;
      const alto = Math.PI - 0.32 * lado; // braço erguido, as mãos juntas no alto
      const b = mistura(-Math.sin(ph) * 0.85, alto, k);
      const cotovelo = ponta(ombro, b, A1);
      const ante = mistura(b + 1.5, alto - 0.12 * lado, k);
      const mao = ponta(cotovelo, ante, A2);
      traco(ombro, cotovelo, cor, esp * 0.85);
      traco(cotovelo, mao, cor, esp * 0.85);
      return mao;
    };

    const atras = 'rgba(238,245,232,.55)';
    perna(Math.PI, atras);
    const maoAtras = braco(Math.PI, atras, -1);
    traco(quadril, ombro, COR.camisa, esp * 1.6);
    perna(0, COR.corpo);
    const maoFrente = braco(0, COR.corpo, 1);
    const cabeca = { x: ombro.x + Math.sin(inclinacao) * (r + s * 0.18), y: ombro.y - Math.cos(inclinacao) * (r + s * 0.18) };
    ctx.fillStyle = COR.corpo;
    ctx.beginPath();
    ctx.arc(cabeca.x, cabeca.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (k > 0.55) {
      const m = { x: (maoAtras.x + maoFrente.x) / 2, y: Math.min(maoAtras.y, maoFrente.y) };
      ctx.globalAlpha = Math.min(1, (k - 0.55) / 0.3);
      desenharTrofeu(m.x, m.y - s * 0.35, s * 0.8);
      ctx.globalAlpha = 1;
    }
  }

  function soltarConfete() {
    for (let i = 0; i < 140; i++) {
      confete.push({
        x: Math.random() * largura,
        y: -Math.random() * altura * 0.5,
        vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 120,
        giro: Math.random() * Math.PI,
        vg: (Math.random() - 0.5) * 8,
        t: 4 + Math.random() * 6,
        cor: CONFETE[i % CONFETE.length],
      });
    }
  }

  function desenharConfete(dt) {
    for (const c of confete) {
      c.vy += 30 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.giro += c.vg * dt;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.giro);
      ctx.fillStyle = c.cor;
      ctx.fillRect(-c.t / 2, -c.t / 4, c.t, c.t / 2);
      ctx.restore();
    }
    for (let i = confete.length - 1; i >= 0; i--) if (confete[i].y > altura + 20) confete.splice(i, 1);
  }

  function desenhar(agora) {
    if (!vivo) return;
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    let k = 0;
    if (comemoracaoT0 !== null) {
      k = suave(Math.min(1, (agora - comemoracaoT0) / 900));
      velocidade = 1 - k;
    }
    const s = escala();
    fase += dt * 9.5 * velocidade;
    rolagem += dt * s * 7 * velocidade;
    ctx.clearRect(0, 0, largura, altura);
    desenharPista();
    desenharCorredor(k);
    desenharConfete(dt);
    if (!reduzido) quadro = requestAnimationFrame(desenhar);
  }

  if (reduzido) {
    desenhar(performance.now());
  } else {
    quadro = requestAnimationFrame(desenhar);
  }

  return {
    comemorar() {
      if (comemoracaoT0 !== null && !reduzido) return;
      if (reduzido) {
        desenhar(performance.now());
        return;
      }
      comemoracaoT0 = performance.now();
      soltarConfete();
    },
    destruir() {
      vivo = false;
      cancelAnimationFrame(quadro);
      window.removeEventListener('resize', medir);
    },
  };
}
