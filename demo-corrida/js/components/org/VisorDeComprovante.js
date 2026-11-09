import { h, Fragment } from 'preact';
// O comprovante na tela da mesa: busca por fetch (o cookie vai junto) e mostra
// a imagem ou o PDF por URL de blob, revogada ao trocar de inscrição.
import { useEffect, useState } from 'react';
import { baixarComprovante } from '../../lib/api-org.js';
export default function VisorDeComprovante({ inscricaoId, tem, de = 'colaborador', }) {
    const [arquivo, setArquivo] = useState(null);
    const [erro, setErro] = useState(null);
    useEffect(() => {
        if (!tem)
            return;
        let url = '';
        let vivo = true;
        baixarComprovante(inscricaoId, de)
            .then((blob) => {
            url = URL.createObjectURL(blob);
            if (vivo)
                setArquivo({ url, pdf: blob.type === 'application/pdf' });
        })
            .catch((e) => vivo && setErro(e.message));
        return () => {
            vivo = false;
            setArquivo(null);
            setErro(null);
            if (url)
                URL.revokeObjectURL(url);
        };
    }, [inscricaoId, tem, de]);
    if (!tem)
        return h("p", { className: "rounded-xl bg-trilho p-6 text-center text-sm text-texto-suave" }, "Sem comprovante anexado.");
    if (erro)
        return h("p", { className: "text-sm font-semibold text-perigo" }, erro);
    if (!arquivo)
        return h("p", { className: "text-sm text-texto-suave" }, "Abrindo o comprovante\u2026");
    return arquivo.pdf ? (h("iframe", { title: "Comprovante", src: arquivo.url, className: "h-[70vh] w-full rounded-xl border border-borda" })) : (h("img", { src: arquivo.url, alt: "Comprovante do Pix", className: "max-h-[70vh] w-full rounded-xl border border-borda object-contain" }));
}
