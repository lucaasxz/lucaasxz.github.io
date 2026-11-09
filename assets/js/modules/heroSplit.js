// O corte acompanha a posição do mouse: quanto mais para um lado, mais o rosto
// troca para aquele estilo e desliza para o lado oposto. Fora do topo volta para 50/50.
// No toque fica parado, dividido ao meio.
export function initHeroSplit(splitId = 'heroSplit') {
  const split = document.getElementById(splitId);
  const hero  = split?.closest('section');
  if (!split || !hero) return;

  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const comMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DESLOCAMENTO = 9;                       // % da largura da foto
  const ALCANCE = 1.1;                          // chega ao lado inteiro antes da borda da tela
  let alvo = 50, atual = 50, rafId = null;

  const limitar = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  function desenhar() {
    atual += (alvo - atual) * (reduzir ? 1 : 0.022);
    if (Math.abs(alvo - atual) < 0.02) atual = alvo;
    const lado = (atual - 50) / 50;             // -1 = cloud inteiro, 1 = dev inteiro
    split.style.setProperty('--corte', `${atual.toFixed(2)}%`);
    split.style.setProperty('--desloc', `${(lado * DESLOCAMENTO).toFixed(2)}%`);
    split.style.setProperty('--op-dev',   limitar(1 + lado * 1.4).toFixed(3));
    split.style.setProperty('--op-cloud', limitar(1 - lado * 1.4).toFixed(3));
    split.style.setProperty('--op-codigo', (lado > 0 ? 0.22 * (1 - lado) : 0.22 - lado * 0.18).toFixed(3));
    split.style.setProperty('--op-codigo-dev', (lado < 0 ? 0.22 * (1 + lado) : 0.22 + lado * 0.18).toFixed(3));
    rafId = atual === alvo ? null : requestAnimationFrame(desenhar);
  }

  function animar() {
    if (!rafId) rafId = requestAnimationFrame(desenhar);
  }

  function mover(valor) {
    alvo = valor;
    animar();
  }

  function pelaPosicao(x) {
    const caixa = hero.getBoundingClientRect();
    const r = (x - caixa.left) / caixa.width;   // 0 = esquerda, 1 = direita
    return limitar(50 + (0.5 - r) * 100 * ALCANCE, 0, 100);
  }

  // no toque fica parado no meio a meio, como no exemplo
  if (!comMouse) return;
  hero.addEventListener('pointermove', e => mover(pelaPosicao(e.clientX)));
  hero.addEventListener('pointerleave', () => mover(50));
}
