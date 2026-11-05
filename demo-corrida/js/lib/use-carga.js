import { useCallback, useEffect, useState } from 'react';
/** Carrega dados de uma função assíncrona, com erro e recarga. */
export function useCarga(buscar, deps) {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const carregar = useCallback(buscar, deps);
    const recarregar = useCallback(() => {
        carregar()
            .then((d) => {
            setDados(d);
            setErro(null);
        })
            .catch((e) => setErro(e.message));
    }, [carregar]);
    useEffect(() => {
        let vivo = true;
        carregar()
            .then((d) => vivo && (setDados(d), setErro(null)))
            .catch((e) => vivo && setErro(e.message));
        return () => {
            vivo = false;
        };
    }, [carregar]);
    return { dados, erro, recarregar };
}
