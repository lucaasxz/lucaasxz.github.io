import { h, Fragment } from 'preact';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
const raiz = document.getElementById('root');
if (!raiz) {
    throw new Error('Elemento #root não encontrado no index.html.');
}
createRoot(raiz).render(h(StrictMode, null,
    h(App, null)));
