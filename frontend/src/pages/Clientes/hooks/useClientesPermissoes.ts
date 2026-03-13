import { useMemo } from 'react';
import type { CurrentUser, UserPermissions } from '@/hooks/useCurrentUser';

export const useClientesPermissoes = (currentUser: CurrentUser | undefined | null) => {
    const hasPermission = (section: string, action: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        const sectionPerms = currentUser.parsedPermissions[section as keyof UserPermissions];
        if (!sectionPerms) return false;
        return (sectionPerms as Record<string, boolean>)[action] === true;
    };

    return useMemo(() => ({
        canViewKanban: hasPermission('clients', 'view_kanban'),
        canViewList: hasPermission('clients', 'view_list'),
        canViewCharts: hasPermission('clients', 'view_charts'),
        canRedistribute: hasPermission('clients', 'redistribute'),
        canUseFilters: hasPermission('clients', 'use_filters'),
        canExport: hasPermission('clients', 'export'),
        canCreate: hasPermission('clients', 'create'),
        canEdit: hasPermission('clients', 'edit'),
        canDelete: hasPermission('clients', 'delete'),
        canAdvanceStage: hasPermission('clients', 'advance_stage'),
        canBackStage: hasPermission('clients', 'back_stage'),
        canReassign: hasPermission('clients', 'reassign'),
        canPauseAI: hasPermission('clients', 'pause_ai'),
        canSendMessage: hasPermission('clients', 'send_message'),
        hasPermission,
    }), [currentUser]);
};
