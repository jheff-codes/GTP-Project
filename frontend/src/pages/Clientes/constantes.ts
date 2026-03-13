import type { Filters } from './tipos';

export const KANBAN_COLUMNS = [
    { key: 'repasse', label: 'Repasse', color: 'border-slate-500' },
    { key: 'disparo', label: 'Disparo', color: 'border-slate-400' },
    { key: 'qualificando', label: 'Qualificando', color: 'border-cyan-500' },
    { key: 'qualificado', label: 'Qualificado', color: 'border-teal-500' },
    { key: 'agendando', label: 'Agendando', color: 'border-emerald-500' },
    { key: 'agendado', label: 'Agendado', color: 'border-teal-400' },
    { key: 'ligação', label: 'Ligação', color: 'border-green-500' },
    { key: 'visita', label: 'Visita', color: 'border-lime-500' },
    { key: 'followup', label: 'Follow-up', color: 'border-yellow-500' },
    { key: 'proposta', label: 'Proposta', color: 'border-orange-500' },
    { key: 'venda', label: 'Venda', color: 'border-primary' },
    { key: 'descartado', label: 'Descartado', color: 'border-destructive' },
] as const;

export const defaultFilters: Filters = {
    cidade: '',
    bairro: '',
    quartos: '',
    tipo_imovel: '',
    modo_compra: '',
    tipo_servico: '',
    declara_ir: '',
    status: '',
    owner_id: '',
    date_min: '',
    date_max: '',
    responsavel_cargo: 'all',
    filter_imob_id: '',
    filter_director_id: '',
    filter_manager_id: '',
    filter_coordinator_id: '',
    filter_broker_id: '',
};
