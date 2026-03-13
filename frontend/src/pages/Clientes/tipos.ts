export type ViewMode = 'kanban' | 'list' | 'redistribute' | 'charts';

export interface Filters {
    cidade: string;
    bairro: string;
    quartos: string;
    tipo_imovel: string;
    modo_compra: string;
    tipo_servico: string;
    declara_ir: string;
    status: string;
    owner_id: string;
    date_min: string;
    date_max: string;
    responsavel_cargo: string;
    filter_imob_id: string;
    filter_director_id: string;
    filter_manager_id: string;
    filter_coordinator_id: string;
    filter_broker_id: string;
}
