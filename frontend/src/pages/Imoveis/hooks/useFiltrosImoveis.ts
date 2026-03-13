import { useState, useMemo, useCallback } from 'react';
import type { Imovel, FiltrosImoveis } from '../tipos';
import { FILTROS_INICIAIS } from '../tipos';

const parseCurrency = (value: string | null): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

export function useFiltrosImoveis(imoveis: Imovel[]) {
    const [filters, setFilters] = useState<FiltrosImoveis>(FILTROS_INICIAIS);

    const filteredImoveis = useMemo(() => {
        return imoveis.filter(prop => {
            if (filters.nome && !prop.nome_do_imovel?.toLowerCase().includes(filters.nome.toLowerCase())) return false;
            if (filters.cidade && prop.cidade !== filters.cidade) return false;
            if (filters.tipo && prop.tipo_do_imovel !== filters.tipo) return false;

            const propPrice = parseCurrency(prop.preco);
            if (filters.minPreco && propPrice < parseCurrency(filters.minPreco)) return false;
            if (filters.maxPreco && propPrice > parseCurrency(filters.maxPreco)) return false;

            const propIncome = parseCurrency(prop.renda);
            if (filters.minRenda && propIncome < parseCurrency(filters.minRenda)) return false;
            if (filters.maxRenda && propIncome > parseCurrency(filters.maxRenda)) return false;

            if (filters.minQuartos && (Number(prop.quartos) || 0) < Number(filters.minQuartos)) return false;

            const propArea = prop.area_util ? parseFloat(prop.area_util.replace(/\D/g, '')) : 0;
            if (filters.minArea && propArea < Number(filters.minArea)) return false;

            return true;
        });
    }, [imoveis, filters]);

    const handleClearFilters = useCallback(() => {
        setFilters(FILTROS_INICIAIS);
    }, []);

    return {
        filters,
        setFilters,
        filteredImoveis,
        handleClearFilters,
    };
}
