import type { Tables } from '@/lib/database.types';

export type Imovel = Tables<'imoveis'>;

export interface FiltrosImoveis {
    nome: string;
    cidade: string;
    bairro: string;
    tipo: string;
    minPreco: string;
    maxPreco: string;
    minRenda: string;
    maxRenda: string;
    minQuartos: string;
    minArea: string;
}

export const FILTROS_INICIAIS: FiltrosImoveis = {
    nome: '',
    cidade: '',
    bairro: '',
    tipo: '',
    minPreco: '',
    maxPreco: '',
    minRenda: '',
    maxRenda: '',
    minQuartos: '',
    minArea: '',
};
