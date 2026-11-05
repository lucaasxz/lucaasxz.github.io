// -----------------------------------------------------------------------------
// termos.js — os textos dos aceites. Na demonstração, textos genéricos de
// exemplo; o prazo de guarda (90 dias após o evento) é ilustrativo.
// -----------------------------------------------------------------------------
export const TERMO_SAUDE = 'Declaro que estou em condições de saúde para participar da modalidade escolhida e que a participação é voluntária, sob minha responsabilidade.';
export const TERMO_RESP_CONV = 'Declaro que sou responsável pelo meu convidado durante todo o evento e que ele está em condições de saúde para participar.';
/** Sem a idade do convidado (adendo 3), a frase vale sempre, condicional. */
export const TERMO_RESP_MENOR = 'Se o convidado for menor de 18 anos, declaro ser o responsável legal por ele ou ter a autorização do responsável legal.';
export const TERMO_LGPD = 'Li e entendi como os meus dados e os do meu convidado são tratados: a empresa organizadora usa nome, matrícula, telefone, contato de emergência, os dados do convidado e o comprovante do Pix só para a inscrição, os kits, o contato de emergência no dia e a conferência do pagamento. Os comprovantes e os dados da inscrição são apagados em até 90 dias após o evento.';
export const TERMO_IMAGEM = 'Autorizo o uso da minha imagem e a do meu convidado em fotos e vídeos do evento, na comunicação interna da empresa.';
/** A frase do canal do encarregado , quando a organização o informar. */
export function linhaEncarregado(canal) {
    return canal
        ? `Dúvidas sobre os seus dados: fale com o encarregado pelo tratamento de dados — ${canal}.`
        : 'Dúvidas sobre os seus dados: fale com o encarregado pelo tratamento de dados da empresa.';
}
