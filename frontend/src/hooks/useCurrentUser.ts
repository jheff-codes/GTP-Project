import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Permissions interface
export interface UserPermissions {
    dashboard?: {
        view?: boolean;
        view_top_corretores?: boolean;
        view_leads_ociosos?: boolean;
    };
    clients?: {
        view_kanban?: boolean;
        view_list?: boolean;
        view_charts?: boolean;
        redistribute?: boolean;
        use_filters?: boolean;
        export?: boolean;
        create?: boolean;
        edit?: boolean;
        delete?: boolean;
        advance_stage?: boolean;
        back_stage?: boolean;
        reassign?: boolean;
        pause_ai?: boolean;
        send_message?: boolean;
        take_over?: boolean;
    };
    properties?: {
        view?: boolean;
        use_filters?: boolean;
        add?: boolean;
        edit?: boolean;
        delete?: boolean;
    };
    calendar?: {
        use_filters?: boolean;
        filter_type?: boolean;
        view_month?: boolean;
        view_week?: boolean;
        view_day?: boolean;
        create?: boolean;
        edit?: boolean;
        delete?: boolean;
    };
    team?: {
        view_team?: boolean;
        view_queue?: boolean;
        add_member?: boolean;
        block_access?: boolean;
        manage_checkin?: boolean;
        manage_member?: boolean;
        delete_user?: boolean;
    };
    disparos?: {
        ver_disparos?: boolean;
        fazer_disparos?: boolean;
        gerenciar_tabelas_disparos?: boolean;
        excluir_disparos?: boolean;
    };
}

// Current user with full profile and permissions
export interface CurrentUser extends Profile {
    parsedPermissions: UserPermissions;
}

// Hook to get current logged in user with their profile and permissions
export function useCurrentUser() {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async (): Promise<CurrentUser | null> => {
            // 1. Get current authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // 2. Get current user's profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error || !profile) return null;

            // 3. Parse permissions from the profile
            // Permissions are stored in profile.permissions.note as per ManageTeam.tsx
            const rawPermissions = (profile as Profile).permissions;
            let parsedPermissions: UserPermissions = {};

            if (rawPermissions && typeof rawPermissions === 'object') {
                // Check if permissions are in .note property (as used in ManageTeam)
                if ('note' in rawPermissions) {
                    parsedPermissions = rawPermissions.note as UserPermissions;
                } else {
                    parsedPermissions = rawPermissions as unknown as UserPermissions;
                }
            }

            // imobiliaria: usa permissões do banco (definidas pelo admin)
            // Apenas admin recebe passe livre hardcoded
            if ((profile as Profile).role === 'admin') {
                // Admin: Read-only for clients, full access for others
                parsedPermissions = {
                    dashboard: {
                        view: true,
                        view_top_corretores: true,
                        view_leads_ociosos: true
                    },
                    clients: {
                        view_kanban: true,
                        view_list: true,
                        view_charts: true,
                        redistribute: false,
                        use_filters: true,
                        create: false,
                        edit: false,
                        delete: false,
                        advance_stage: false,
                        back_stage: false,
                        reassign: false,
                        pause_ai: false,
                        send_message: false,
                        take_over: false,
                        export: true,
                    },
                    properties: {
                        view: true,
                        use_filters: true,
                        add: true,
                        edit: true,
                        delete: true,
                    },
                    calendar: {
                        use_filters: true,
                        filter_type: true,
                        view_month: true,
                        view_week: true,
                        view_day: true,
                        create: true,
                        edit: true,
                        delete: true,
                    },
                    team: {
                        view_team: true,
                        view_queue: true,
                        add_member: true,
                        block_access: true,
                        manage_checkin: true,
                        manage_member: true,
                        delete_user: true,
                    },
                    disparos: {
                        ver_disparos: true,
                        fazer_disparos: true,
                        gerenciar_tabelas_disparos: true,
                        excluir_disparos: true,
                    },
                };
            }

            return {
                ...(profile as Profile),
                parsedPermissions,
            };
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}

// Helper hook to check specific permission
export function useHasPermission(section: keyof UserPermissions, action: string): boolean {
    const { data: currentUser } = useCurrentUser();

    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const sectionPermissions = currentUser.parsedPermissions[section];
    if (!sectionPermissions) return false;

    return (sectionPermissions as Record<string, boolean>)[action] === true;
}
