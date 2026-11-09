// -----------------------------------------------------------------------------
// regras.js — as regras puras da inscrição, MÓDULO COMPARTILHADO.
//
// No sistema real, o servidor tem uma cópia fiel destas regras e é quem decide;
// a tela usa estas funções para avisar cedo. Na demonstração, a API simulada
// (lib/demo/) reaproveita este mesmo módulo. Por isso não tem import nenhum.
// -----------------------------------------------------------------------------
export const MAX_CONVIDADOS = 1;
/** Quem segura vaga (decisão 3 e adendo de 20/10): a reserva sem pagamento
 *  ocupa enquanto o prazo de 24 h corre. A mesma lista está literal no SQL da 0002. */
export const SITUACOES_QUE_OCUPAM = ['pendente', 'confirmada', 'aguardando_pagamento'];
/** Inscrição viva — uma por matrícula. A lista de espera é viva, mas não ocupa vaga. */
export const SITUACOES_VIVAS = [...SITUACOES_QUE_OCUPAM, 'lista_espera'];
/** Quanto tempo a reserva sem pagamento segura a vaga (o mesmo na 0002). */
export const PRAZO_PAGAMENTO_HORAS = 24;
/** A chave 'corrida_5_5' é o dado gravado; o percurso passou a 6 km (adendo 4). */
export const MODALIDADES = { corrida_5_5: 'Corrida 6 km', caminhada_4: 'Caminhada 4 km' };
/** Só do convidado (adendo 3): o colaborador não escolhe tamanho. BL = baby look. */
export const CAMISETAS = ['BL PP', 'BL P', 'BL M', 'BL G', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'XGGG'];
/** 3 MB: o comprovante sobe em base64 no JSON, e a hospedagem corta corpos
 *  grandes. Foto maior é reduzida no navegador. */
export const MAX_COMPROVANTE_BYTES = 3 * 1024 * 1024;
/** Tamanhos aceitos (caracteres, depois do trim) — os mesmos nos dois lados. */
export const LIMITE_SETOR = { min: 2, max: 80 };
export const LIMITE_EMERGENCIA_NOME = { min: 2, max: 120 };
export const MAX_GRUPO_ID = 40;
/** A produção se inscreve na mesa, no notebook do admin da corrida, sem o termo e
 *  sem anexar o comprovante (que vai para o WhatsApp da organização), pela LGPD.
 *  Os demais grupos seguem pela página. */
export const GRUPOS_DA_PRODUCAO = ['turno_a', 'turno_b', 'turno_c'];
export function daProducao(grupoId) {
    return GRUPOS_DA_PRODUCAO.includes(grupoId);
}
/** Crianças nas brincadeiras por inscrição (adendo 7): não correm nem ocupam vaga. */
export const MAX_CRIANCAS = 10;
/** Linhas da importação por chamada — cabe no tempo de uma função serverless. */
export const MAX_LINHAS_POR_LOTE = 25;
export const COLUNAS_IMPORTACAO = [
    'matricula', 'nome', 'setor', 'grupo', 'telefone', 'modalidade', 'emergencia_nome',
    'emergencia_tel', 'conv_nome', 'conv_modalidade', 'conv_camiseta', 'autoriza_imagem', 'pago',
];
export const RECUSA = {
    encerradas: 'As inscrições da Corrida 2026 estão encerradas.',
    matricula: 'Esta matrícula já tem inscrição. Acompanhe pelo link que você recebeu ou fale com a organização.',
    colaborador: 'As vagas do seu turno já foram preenchidas.',
    comprovante: 'Anexe o comprovante do Pix (imagem ou PDF, até 3 MB).',
    corrida: 'Alguém acabou de pegar a última vaga. Confira as vagas do seu turno.',
    prazo: 'O prazo para pagar terminou. Fale com a organização.',
    foraDaBase: 'Não encontramos esta matrícula entre os colaboradores da corrida. Confira o número ou fale com a organização para fazer a inscrição.',
    grupoFechado: 'As inscrições do seu turno não estão abertas pelo site. Fale com a organização.',
    producaoNaMesa: 'Pelo cadastro, você é da produção: a sua inscrição é feita com o admin da corrida, no notebook da organização, e não por esta página.',
};
export const ERRO_CAMPO = {
    grupo: 'Escolha o seu turno.',
    matricula: 'Informe a matrícula, só com números (até 10 dígitos).',
    nome: 'Informe o nome completo, sem apelidos ou abreviações.',
    setor: 'Informe o seu setor.',
    telefone: 'Informe o telefone com DDD.',
    emergencia: 'Informe o nome e o telefone com DDD do contato de emergência.',
    modalidade: 'Escolha corrida de 6 km ou caminhada de 4 km.',
    convidadoNome: 'Informe o nome completo do convidado, sem apelidos ou abreviações.',
    convidadoModalidade: 'Escolha a modalidade do convidado.',
    convidadoCamiseta: 'Escolha o tamanho da camiseta do convidado.',
    criancas: 'Responda se vai levar criança para as brincadeiras.',
    criancasQtd: 'Informe quantas crianças vão (de 1 a 10).',
    aceiteSaude: 'Confirme a declaração de saúde para continuar.',
    aceiteRespConv: 'Confirme a responsabilidade pelo convidado para continuar.',
    aceiteLgpd: 'Confirme que leu como seus dados são tratados (LGPD) para continuar.',
    autorizaImagem: 'Responda se autoriza o uso de imagem.',
};
const CONECTORES = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
const MAX_NOME = 120;
/** NFC (o teclado do Mac pode mandar o acento separado), apóstrofo reto e
 *  espaços simples. */
function limparNome(nome) {
    return nome.normalize('NFC').replace(/[’‘]/g, "'").trim().replace(/\s+/g, ' ');
}
/** Nome completo válido (decisão 5). Devolve null ou a frase de recusa. */
export function validarNome(nome) {
    const limpo = limparNome(nome);
    if (limpo.length === 0 || limpo.length > MAX_NOME)
        return ERRO_CAMPO.nome;
    if (!/^[\p{L}\p{M}' -]+$/u.test(limpo))
        return ERRO_CAMPO.nome;
    const palavras = limpo.split(' ');
    const ultima = palavras.length - 1;
    let fortes = 0;
    for (const [i, palavra] of palavras.entries()) {
        if (CONECTORES.has(palavra.toLocaleLowerCase('pt-BR'))) {
            if (i === 0 || i === ultima)
                return ERRO_CAMPO.nome;
            continue;
        }
        const letras = palavra.match(/\p{L}/gu)?.length ?? 0;
        if (letras < 2 || !/^\p{L}/u.test(palavra) || !/[\p{L}\p{M}]$/u.test(palavra))
            return ERRO_CAMPO.nome;
        fortes++;
    }
    return fortes >= 2 ? null : ERRO_CAMPO.nome;
}
/** Para gravar: limpo, Primeira Maiúscula, da/de/do no meio em minúsculo. */
export function normalizarNome(nome) {
    const palavras = limparNome(nome).split(' ');
    const ultima = palavras.length - 1;
    return palavras
        .map((palavra, i) => {
        const minusculo = palavra.toLocaleLowerCase('pt-BR');
        if (i > 0 && i < ultima && CONECTORES.has(minusculo))
            return minusculo;
        return minusculo.replace(/(^|[-'])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('pt-BR'));
    })
        .join(' ');
}
/** Valor devido em centavos. */
export function valorDevido(convidados, precos) {
    return precos.colaborador + precos.convidado * convidados;
}
export function criancasValidas(n) {
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= MAX_CRIANCAS;
}
/** Vagas livres no turno: a cota menos colaboradores e convidados que ocupam. */
export function vagasLivres(grupo, ocupadas) {
    return Math.max(0, grupo.cotaColaborador - ocupadas.colaborador - ocupadas.convidado);
}
/** Sem espaço e sem zero à esquerda: "00123" e "123" são a mesma pessoa. */
export function normalizarMatricula(m) {
    return m.trim().replace(/^0+/, '');
}
/** Só dígitos, 1 a 10, e não só zeros. */
export function matriculaValida(m) {
    return /^\d{1,10}$/.test(m.trim()) && normalizarMatricula(m) !== '';
}
/** Só dígitos, sem o +55 de quem cola o número do WhatsApp. */
export function normalizarTelefone(t) {
    const digitos = t.replace(/\D/g, '');
    return (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55') ? digitos.slice(2) : digitos;
}
/** (11) 98765-4321 ou (11) 3333-4444; o parcial fica parcial (máscara de digitação). */
export function formatarTelefone(texto) {
    const d = normalizarTelefone(texto).slice(0, 11);
    if (d.length === 0)
        return '';
    if (d.length <= 2)
        return `(${d}`;
    const ddd = d.slice(0, 2);
    const resto = d.slice(2);
    if (resto.length <= 4)
        return `(${ddd}) ${resto}`;
    const meio = resto.length === 9 ? 5 : 4;
    return `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}
/** DDD (11–99) + 8 ou 9 dígitos. */
export function telefoneValido(t) {
    return /^[1-9][1-9]\d{8,9}$/.test(normalizarTelefone(t));
}
