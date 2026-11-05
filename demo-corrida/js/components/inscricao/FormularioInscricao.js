import { h, Fragment } from 'preact';
// -----------------------------------------------------------------------------
// FormularioInscricao — os seis passos numa página só, com barra de progresso
// e sem modal. Serve à página pública (modo 'publico') e ao balcão da
// organização (modo 'balcao', outro endpoint). Avançar confere o passo com as
// regras do servidor; quem decide é o POST. Um 409 de vaga recarrega as vagas
// e leva a pessoa ao passo certo, com tudo o que ela digitou ainda na tela.
// O passo 1 é a matrícula (o turno vem da base, adendo 2), também no balcão
// desde 21/10; fora da base, o balcão escolhe o turno. A produção (21/10) se
// inscreve no balcão e pula o termo: avançar e voltar seguem os passos do grupo.
// -----------------------------------------------------------------------------
import { useRef, useState } from 'react';
import { daProducao } from '../../lib/regras.js';
import { enviarInscricao, novoTokenNavegador } from '../../lib/api-publica.js';
import { erroDoPasso, estadoInicial as vazio, listaEsperaDoEstado, montarCorpo, passoAnterior, passoDoMotivo, passosDoFormulario, proximoPasso, } from '../../lib/formulario.js';
import BarraDeProgresso from './BarraDeProgresso.js';
import { BotaoPrincipal } from './controles.js';
import Enviado from './Enviado.js';
import PassoConvidado from './PassoConvidado.js';
import PassoDados from './PassoDados.js';
import PassoMatricula from './PassoMatricula.js';
import PassoPagamento from './PassoPagamento.js';
import PassoProva from './PassoProva.js';
import PassoTermo from './PassoTermo.js';
import { TotalDeEtapas } from './total-de-etapas.js';
const CHAVE_ULTIMA = 'corrida.ultima';
function lembrar(inscrita) {
    try {
        localStorage.setItem(CHAVE_ULTIMA, JSON.stringify({ id: inscrita.id, token: inscrita.token, codigo: inscrita.codigo }));
    }
    catch {
        // Navegação privada ou armazenamento bloqueado: o link continua na tela.
    }
}
function rotuloDoEnvio(e, vagas, modo) {
    if (listaEsperaDoEstado(e, vagas))
        return 'Entrar na lista de espera';
    if (modo === 'balcao' && e.pagoNoBalcao)
        return 'Inscrever (pago no balcão)';
    if (daProducao(e.grupoId))
        return 'Inscrever e reservar a vaga';
    return e.comprovante ? 'Enviar inscrição' : 'Reservar vaga (pagar depois)';
}
export default function FormularioInscricao({ modo, vagas, aoRecarregarVagas, enviarPara, estadoInicial, passoInicial = 1, inscritaInicial = null, }) {
    const [estado, setEstado] = useState(() => estadoInicial ?? vazio(novoTokenNavegador()));
    const [passo, setPasso] = useState(passoInicial);
    const [erro, setErro] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [inscrita, setInscrita] = useState(inscritaInicial);
    const topo = useRef(null);
    const alterar = (parcial) => {
        setEstado((e) => ({ ...e, ...parcial }));
        setErro(null);
    };
    function irPara(p) {
        setPasso(p);
        topo.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    function avancar() {
        const problema = erroDoPasso(passo, estado, vagas, modo);
        if (problema) {
            setErro(problema);
            return;
        }
        setErro(null);
        irPara(proximoPasso(passo, estado));
    }
    async function enviar() {
        const problema = erroDoPasso(6, estado, vagas, modo);
        if (problema) {
            setErro(problema);
            return;
        }
        setEnviando(true);
        setErro(null);
        const r = await enviarInscricao(montarCorpo(estado, modo, vagas), enviarPara);
        setEnviando(false);
        if (r.ok) {
            setInscrita(r.inscrita);
            if (modo === 'publico')
                lembrar(r.inscrita);
            irPara(7);
            return;
        }
        const destino = passoDoMotivo(r.motivo, modo);
        if (destino) {
            await aoRecarregarVagas();
            irPara(destino);
        }
        // A vaga acabou enquanto a pessoa preenchia: a fila continua aberta para ela.
        setErro(r.motivo === 'colaborador' ? `${r.erro} Se quiser, siga e entre na lista de espera.` : r.erro);
    }
    function novaInscricao() {
        setEstado(vazio(novoTokenNavegador()));
        setInscrita(null);
        setErro(null);
        irPara(1);
    }
    const passos = passosDoFormulario(estado);
    return (h(TotalDeEtapas.Provider, { value: passos.length },
        h("div", { ref: topo, className: "scroll-mt-4" },
            passo <= 6 && h(BarraDeProgresso, { passo: passo, passos: passos }),
            passo === 1 && h(PassoMatricula, { estado: estado, alterar: alterar, vagas: vagas, modo: modo }),
            passo === 2 && h(PassoDados, { estado: estado, alterar: alterar, modo: modo }),
            passo === 3 && h(PassoProva, { estado: estado, alterar: alterar }),
            passo === 4 && h(PassoConvidado, { estado: estado, alterar: alterar, vagas: vagas }),
            passo === 5 && h(PassoTermo, { estado: estado, alterar: alterar, canalEncarregado: vagas.canalEncarregado }),
            passo === 6 && h(PassoPagamento, { estado: estado, alterar: alterar, vagas: vagas, modo: modo }),
            passo === 7 && inscrita && (h(Enviado, { inscrita: inscrita, modo: modo, comConvidado: estado.levaConvidado, aoNova: modo === 'balcao' ? novaInscricao : undefined, comprovantePeloWhatsapp: daProducao(estado.grupoId) ? (vagas.whatsapp ?? '') : null })),
            erro && (h("p", { role: "alert", className: "mt-4 rounded-xl border-2 border-perigo px-3 py-2 text-sm font-semibold text-perigo" }, erro)),
            passo <= 6 && (h("div", { className: "mt-6 grid gap-3" },
                passo < 6 ? (h(BotaoPrincipal, { onClick: avancar }, "Continuar")) : (h(BotaoPrincipal, { onClick: () => void enviar(), disabled: enviando }, enviando ? 'Enviando…' : rotuloDoEnvio(estado, vagas, modo))),
                passo > 1 && (h("button", { type: "button", className: "min-h-11 font-semibold text-texto-suave underline", onClick: () => {
                        setErro(null);
                        irPara(passoAnterior(passo, estado));
                    } }, "Voltar")))))));
}
