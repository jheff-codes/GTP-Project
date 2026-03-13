// Status order for funnel (cumulative counting)
export const FUNNEL_STAGES_ORDER = [
    'qualificando', 'qualificado', 'agendando', 'agendado', 'ligação', 'visita', 'followup', 'proposta', 'venda'
];

// Stages that are 'qualifying' or beyond (index >= 2)
export const QUALIFYING_PLUS_STAGES = FUNNEL_STAGES_ORDER.slice(2);

export const FUNNEL_STAGES = [
    { key: 'qualificando', label: 'Qualificando', color: '#8b5cf6' },
    { key: 'qualificado', label: 'Qualificado', color: '#a855f7' },
    { key: 'agendando', label: 'Agendando', color: '#d946ef' },
    { key: 'agendado', label: 'Agendado', color: '#cc14ef' },
    { key: 'ligação', label: 'Ligação', color: '#22d3ee' },
    { key: 'visita', label: 'Visita', color: '#f59e0b' },
    { key: 'followup', label: 'Follow-up', color: '#10b981' },
    { key: 'proposta', label: 'Proposta', color: '#14b8a6' },
    { key: 'venda', label: 'Venda', color: '#059669' },
];

// Generate month options
export const MONTHS = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];

// Generate year options (last 5 years)
const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
}));

// Allowed status for "Últimas Conversas"
export const ALLOWED_CONVERSATION_STATUS = [
    'qualificando', 'qualificado', 'agendando', 'agendado', 'ligação', 'visita', 'followup', 'proposta', 'venda'
];
