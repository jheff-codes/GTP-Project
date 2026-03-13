import { Shield, Users, Briefcase, CheckSquare } from 'lucide-react';

// Permission Schema Definition - Granular Control
export const PERMISSIONS_SCHEMA = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        actions: [
            { id: 'view', label: 'Visualizar Dashboard' },
            { id: 'view_top_corretores', label: 'Ver Top Corretores' },
            { id: 'view_leads_ociosos', label: 'Ver Disparo' }
        ]
    },
    {
        id: 'clients',
        label: 'Clientes',
        actions: [
            { id: 'view_kanban', label: 'Ver Kanban' },
            { id: 'view_list', label: 'Ver Lista' },
            { id: 'view_charts', label: 'Ver Gráficos' },
            { id: 'redistribute', label: 'Redistribuir Leads' },
            { id: 'use_filters', label: 'Usar Filtros' },
            { id: 'export', label: 'Exportar' },
            { id: 'advance_stage', label: 'Avançar Etapa' },
            { id: 'back_stage', label: 'Voltar Etapa' },
            { id: 'reassign', label: 'Reatribuir' },
            { id: 'pause_ai', label: 'Pausar IA' },
            { id: 'send_message', label: 'Mandar Mensagem' },
            { id: 'take_over', label: 'Assumir Conversa' }
        ]
    },
    {
        id: 'properties',
        label: 'Portfólio de Imóveis',
        actions: [
            { id: 'view', label: 'Ver Imóveis' },
            { id: 'use_filters', label: 'Usar Filtros' },
            { id: 'add', label: 'Novo Imóvel' },
            { id: 'edit', label: 'Editar Imóvel' },
            { id: 'delete', label: 'Excluir Imóvel' }
        ]
    },
    {
        id: 'calendar',
        label: 'Agenda e Compromissos',
        actions: [
            { id: 'view_month', label: 'Visão Mensal' },
            { id: 'view_week', label: 'Visão Semanal' },
            { id: 'view_day', label: 'Visão Diária' },
            { id: 'create', label: 'Criar Eventos' },
            { id: 'edit', label: 'Editar Eventos' },
            { id: 'delete', label: 'Excluir Eventos' },
            { id: 'filter_type', label: 'Filtrar por Tipo' },
            { id: 'use_filters', label: 'Usar Filtros Gerais' }
        ]
    },
    {
        id: 'team',
        label: 'Gestão de Equipes',
        actions: [
            { id: 'view_team', label: 'Ver Grade de Equipe' },
            { id: 'view_queue', label: 'Ver Grade de Fila' },
            { id: 'add_member', label: 'Adicionar Membros' },
            { id: 'block_access', label: 'Bloquear Acesso' },
            { id: 'manage_checkin', label: 'Gerenciar Check-in' },
            { id: 'manage_member', label: 'Editar Membros' },
            { id: 'delete_user', label: 'Excluir Usuário' }
        ]
    },
    {
        id: 'disparos',
        label: '🚀 Central de Disparos',
        actions: [
            { id: 'ver_disparos', label: 'Visualizar Disparos' },
            { id: 'fazer_disparos', label: 'Upload e Distribuir' },
            { id: 'gerenciar_tabelas_disparos', label: 'Gerenciar Tabelas' },
            { id: 'excluir_disparos', label: 'Excluir Contatos' }
        ]
    }
];

export const AVAILABLE_ROLES = ['imobiliaria', 'director', 'manager', 'coordinator', 'broker'] as const;

export const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'imobiliaria':
        case 'imob': return 'Imobiliária';
        case 'director': return 'Diretor';
        case 'manager': return 'Gerente';
        case 'coordinator': return 'Coordenador';
        case 'broker':
        case 'corretor': return 'Corretor';
        default: return role;
    }
};

export const getRoleRank = (r: string) => {
    const role = r as string;
    if (role === 'admin') return 100;
    if (role === 'imobiliaria' || role === 'imob') return 90;
    if (role === 'director') return 80;
    if (role === 'manager') return 70;
    if (role === 'coordinator') return 60;
    return 50;
};

export const getRoleGradient = (role: string) => {
    switch (role) {
        case 'admin': return 'from-red-500 to-orange-500';
        case 'imobiliaria':
        case 'imob': return 'from-purple-500 to-pink-500';
        case 'director': return 'from-blue-500 to-cyan-500';
        case 'manager': return 'from-emerald-500 to-teal-500';
        case 'coordinator': return 'from-amber-500 to-yellow-500';
        default: return 'from-slate-500 to-slate-400';
    }
};

export const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 11);
    if (clean.length === 0) return '';
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 7) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
};
