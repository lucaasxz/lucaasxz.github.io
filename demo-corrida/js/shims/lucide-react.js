// -----------------------------------------------------------------------------
// lucide-react.js — os três ícones do Lucide (ISC) que as telas usam, em SVG,
// com a mesma interface do lucide-react (size, strokeWidth, className).
// O import map do index.html aponta "lucide-react" para cá.
// -----------------------------------------------------------------------------
import { h } from 'preact';

function icone(nos) {
  return function Icone({ size = 24, strokeWidth = 2, className, ...resto }) {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', 'stroke-width': strokeWidth, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        class: className, ...resto,
      },
      nos.map(([tag, atributos]) => h(tag, atributos)),
    );
  };
}

export const Eye = icone([
  ['path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }],
  ['circle', { cx: '12', cy: '12', r: '3' }],
]);

export const EyeOff = icone([
  ['path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }],
  ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }],
  ['path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }],
  ['path', { d: 'm2 2 20 20' }],
]);

export const LockKeyhole = icone([
  ['circle', { cx: '12', cy: '16', r: '1' }],
  ['rect', { x: '3', y: '10', width: '18', height: '12', rx: '2' }],
  ['path', { d: 'M7 10V7a5 5 0 0 1 10 0v3' }],
]);
