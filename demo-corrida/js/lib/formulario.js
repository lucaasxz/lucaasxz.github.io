// -----------------------------------------------------------------------------
// formulario.js — o estado do formulário em passos e a validação de cada um,
// com as MESMAS regras e frases do servidor (lib/regras.js). Aqui é só
// para avisar cedo: toda recusa de verdade vem do servidor.
//
// Adendo de 20/10: turno esgotado não é
// mais erro — a pessoa segue e entra na LISTA DE ESPERA, sem pagar; e o
// comprovante é opcional (sem ele, a vaga fica reservada por 24 h).
//
// Adendo 2: na página, o passo 1 é a MATRÍCULA. A busca na base preenche o
// nome e o grupo (o turno deixa de ser escolha); trocar a matrícula apaga os
// dois, e sem eles o passo não avança. O balcão também (21/10): a mesa busca a
// matrícula na base; fora dela, escolhe o turno e digita o nome (semBase).
//
// A produção se inscreve na mesa (21/10): no balcão, o turno da produção pula o
// passo 5 (termo) e o pagamento não tem anexo; na página, a matrícula da
// produção não passa do passo 1.
// -----------------------------------------------------------------------------
import { CAMISETAS, ERRO_CAMPO, RECUSA, LIMITE_EMERGENCIA_NOME, LIMITE_SETOR, MAX_CRIANCAS, MODALIDADES, daProducao, matriculaValida, telefoneValido, validarNome, } from './regras.js';
export function estadoInicial(token) {
    return {
        token, grupoId: '', matricula: '', nome: '', setor: '', setorDaBase: false, semBase: false, telefone: '', emergenciaNome: '', emergenciaTel: '',
        modalidade: '', levaConvidado: false,
        convidado: { nome: '', modalidade: '', camiseta: '' },
        levaCriancas: null, criancas: 1,
        aceiteSaude: false, aceiteRespConv: false, aceiteLgpd: false, autorizaImagem: null, comprovante: null,
        pagoNoBalcao: false,
    };
}
const TODOS = [1, 2, 3, 4, 5, 6];
const SEM_TERMO = [1, 2, 3, 4, 6];
/** Os passos que a pessoa percorre: a produção não passa pelo termo. */
export function passosDoFormulario(e) {
    return daProducao(e.grupoId) ? SEM_TERMO : TODOS;
}
export function proximoPasso(passo, e) {
    const passos = passosDoFormulario(e);
    return passos[passos.indexOf(passo) + 1] ?? 7;
}
export function passoAnterior(passo, e) {
    const passos = passosDoFormulario(e);
    return passos[passos.indexOf(passo) - 1] ?? 1;
}
/** O número que a tela mostra (sem o termo, o pagamento é o 5). */
export function numeroDoPasso(passo, e) {
    return passosDoFormulario(e).indexOf(passo) + 1;
}
const ehModalidade = (v) => Object.hasOwn(MODALIDADES, v);
const ehCamiseta = (v) => CAMISETAS.includes(v);
const entre = (s, l) => s.trim().length >= l.min && s.trim().length <= l.max;
/** O turno esgotou: a pessoa entra na fila (e não paga agora). O convidado não
 *  muda isso: ele sempre espera à parte, na fila dos convidados (adendo 4). */
export function listaEsperaDoEstado(e, vagas) {
    return vagas.grupos.find((g) => g.id === e.grupoId)?.esgotado ?? false;
}
/** Já anexou um comprovante, mas vai para a fila: o arquivo não vai junto, e a
 *  pessoa precisa saber disso antes de enviar (pode ter pagado). */
export function comprovanteFicaDeFora(e, vagas) {
    return listaEsperaDoEstado(e, vagas) && e.comprovante !== null;
}
/** Passo 1 da página sem a busca feita (ou com a matrícula trocada depois dela). */
export const ERRO_BUSCA = 'Toque em "Buscar" para conferir a sua matrícula.';
export function erroDoPasso(passo, e, vagas, modo) {
    const grupo = vagas.grupos.find((g) => g.id === e.grupoId);
    switch (passo) {
        case 1: {
            if (!matriculaValida(e.matricula))
                return ERRO_CAMPO.matricula;
            const semBase = modo === 'balcao' && e.semBase;
            if (semBase)
                return grupo ? null : ERRO_CAMPO.grupo;
            if (!e.nome || !e.grupoId)
                return ERRO_BUSCA;
            if (modo === 'publico' && daProducao(e.grupoId))
                return RECUSA.producaoNaMesa;
            return grupo ? null : RECUSA.grupoFechado;
        }
        case 2:
            return ((modo === 'balcao' && e.semBase ? validarNome(e.nome) : null) ??
                (!e.setorDaBase && !entre(e.setor, LIMITE_SETOR) ? ERRO_CAMPO.setor : null) ??
                (!telefoneValido(e.telefone) ? ERRO_CAMPO.telefone : null) ??
                (!entre(e.emergenciaNome, LIMITE_EMERGENCIA_NOME) || !telefoneValido(e.emergenciaTel) ? ERRO_CAMPO.emergencia : null));
        case 3:
            return ehModalidade(e.modalidade) ? null : ERRO_CAMPO.modalidade;
        case 4: {
            if (e.levaConvidado) {
                const c = e.convidado;
                if (validarNome(c.nome))
                    return ERRO_CAMPO.convidadoNome;
                if (!ehModalidade(c.modalidade))
                    return ERRO_CAMPO.convidadoModalidade;
                if (!ehCamiseta(c.camiseta))
                    return ERRO_CAMPO.convidadoCamiseta;
            }
            if (e.levaCriancas === null)
                return ERRO_CAMPO.criancas;
            return e.levaCriancas && !(Number.isInteger(e.criancas) && e.criancas >= 1 && e.criancas <= MAX_CRIANCAS)
                ? ERRO_CAMPO.criancasQtd
                : null;
        }
        case 5:
            if (!e.aceiteSaude)
                return ERRO_CAMPO.aceiteSaude;
            if (e.levaConvidado && !e.aceiteRespConv)
                return ERRO_CAMPO.aceiteRespConv;
            if (!e.aceiteLgpd)
                return ERRO_CAMPO.aceiteLgpd;
            return e.autorizaImagem === null ? ERRO_CAMPO.autorizaImagem : null;
        default:
            return null;
    }
}
export function montarCorpo(e, modo, vagas) {
    const c = e.convidado;
    const listaEspera = listaEsperaDoEstado(e, vagas);
    return {
        token: e.token,
        grupoId: e.grupoId,
        matricula: e.matricula.trim(),
        nome: e.nome.trim(),
        setor: e.setor.trim(),
        telefone: e.telefone,
        emergenciaNome: e.emergenciaNome.trim(),
        emergenciaTel: e.emergenciaTel,
        modalidade: e.modalidade,
        convidado: e.levaConvidado
            ? { nome: c.nome.trim(), modalidade: c.modalidade, camiseta: c.camiseta }
            : null,
        criancas: e.levaCriancas ? e.criancas : 0,
        aceiteSaude: e.aceiteSaude,
        aceiteLgpd: e.aceiteLgpd,
        aceiteRespConv: e.levaConvidado && e.aceiteRespConv,
        autorizaImagem: e.autorizaImagem,
        // Na fila não se paga, e a produção manda pelo WhatsApp: o arquivo nem sobe.
        comprovante: e.comprovante && !listaEspera && !daProducao(e.grupoId) ? { nome: e.comprovante.nome, base64: e.comprovante.base64 } : null,
        listaEspera,
        ...(modo === 'balcao' ? { pagoNoBalcao: e.pagoNoBalcao } : {}),
    };
}
/** Para onde um 409 de vaga ou de matrícula leva a pessoa. */
export function passoDoMotivo(motivo, _modo) {
    return motivo === 'colaborador' || motivo === 'matricula' ? 1 : null;
}
/** Só a parte do colaborador: o convidado paga quando for chamado (adendo 4). */
export function valorDoEstado(_e, precos) {
    return precos.colaborador;
}
