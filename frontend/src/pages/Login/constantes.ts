import { Shield, Briefcase, Users } from 'lucide-react';

export const ROLE_CATEGORIES = [
    {
        id: 'admin',
        title: 'Administração',
        description: 'Acesso completo ao sistema',
        icon: Shield,
        roles: ['admin', 'imob', 'imobiliaria'],
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-indigo-600',
    },
    {
        id: 'management',
        title: 'Gestão',
        description: 'Gerenciamento de equipes',
        icon: Briefcase,
        roles: ['director', 'manager', 'coordenador', 'coordinator'],
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-cyan-600',
    },
    {
        id: 'broker',
        title: 'Corretor',
        description: 'Atendimento de clientes',
        icon: Users,
        roles: ['broker', 'corretor'],
        color: 'bg-primary',
        gradient: 'from-emerald-500 to-teal-600',
    },
];
