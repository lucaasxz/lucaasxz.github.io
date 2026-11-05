// -----------------------------------------------------------------------------
// comprovante.js — prepara o anexo no navegador. O teto é 3 MB (a hospedagem
// corta corpos grandes, e o arquivo vai em base64 no JSON); foto maior ou HEIC do
// iPhone vira JPEG aqui, para a pessoa não ter de entender o limite. Quem
// decide se o arquivo vale é o servidor (magic bytes + varredura).
// -----------------------------------------------------------------------------
import { MAX_COMPROVANTE_BYTES, RECUSA } from './regras.js';
const DIRETOS = ['image/png', 'image/jpeg', 'image/webp'];
const MAIOR_LADO = 2400;
const ERRO_LEITURA = 'Não conseguimos ler esta imagem. Envie um print (JPG ou PNG) ou um PDF — ou mande pelo WhatsApp.';
export function planoDoArquivo(tipo, nome, tamanho) {
    if (tipo === 'application/pdf' || /\.pdf$/i.test(nome))
        return tamanho <= MAX_COMPROVANTE_BYTES ? 'enviar' : 'recusar';
    if (DIRETOS.includes(tipo) && tamanho <= MAX_COMPROVANTE_BYTES)
        return 'enviar';
    if (tipo.startsWith('image/') || /\.(heic|heif)$/i.test(nome))
        return 'converter';
    return 'recusar';
}
function paraBase64(blob) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result).replace(/^data:[^,]*,/, ''));
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(blob);
    });
}
function jpeg(imagem, qualidade) {
    const escala = Math.min(1, MAIOR_LADO / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext('2d')?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade));
}
export async function prepararComprovante(arquivo) {
    const plano = planoDoArquivo(arquivo.type, arquivo.name, arquivo.size);
    if (plano === 'recusar')
        return { ok: false, erro: RECUSA.comprovante };
    try {
        if (plano === 'enviar') {
            const tipo = arquivo.type || 'application/pdf';
            return { ok: true, comprovante: { nome: arquivo.name, base64: await paraBase64(arquivo), tipo, tamanho: arquivo.size } };
        }
        const imagem = await createImageBitmap(arquivo);
        for (const qualidade of [0.85, 0.7]) {
            const blob = await jpeg(imagem, qualidade);
            if (blob && blob.size <= MAX_COMPROVANTE_BYTES) {
                const nome = `${arquivo.name.replace(/\.[^.]+$/, '') || 'comprovante'}.jpg`;
                return { ok: true, comprovante: { nome, base64: await paraBase64(blob), tipo: 'image/jpeg', tamanho: blob.size } };
            }
        }
        return { ok: false, erro: RECUSA.comprovante };
    }
    catch {
        return { ok: false, erro: ERRO_LEITURA };
    }
}
