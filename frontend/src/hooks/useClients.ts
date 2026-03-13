import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Client, Profile } from '@/lib/database.types';

// Helper function to get all subordinate IDs for a given user
export function getSubordinateIds(userId: string, userRole: string, profiles: Profile[]): string[] {
    const subordinateIds: string[] = [userId]; // Always include the user themselves

    if (userRole === 'admin') {
        // Admin sees all - return all profile IDs
        return profiles.map(p => p.id);
    }

    if (userRole === 'imobiliaria') {
        // Imobiliaria sees all in their agency
        return profiles.filter(p => p.agency_id === userId || p.id === userId).map(p => p.id);
    }

    // For directors, managers, coordinators - find all direct and indirect subordinates
    const findSubordinates = (managerId: string) => {
        const directReports = profiles.filter(p =>
            p.director_id === managerId ||
            p.manager_id === managerId ||
            p.coordinator_id === managerId
        );

        directReports.forEach(report => {
            if (!subordinateIds.includes(report.id)) {
                subordinateIds.push(report.id);
                // Recursively find subordinates of this subordinate
                findSubordinates(report.id);
            }
        });
    };

    findSubordinates(userId);
    return subordinateIds;
}

/**
 * Filter clients based on the strict hierarchy and privacy rules:
 * - Admin/Imob: Sees everything (own + subordinates + unassigned).
 * - Director/Manager/Coord: Sees themselves + subordinates (recursive). Does NOT see unassigned.
 * - Broker: Sees ONLY themselves.
 * @param clients List of clients
 * @param currentUser The current logged in profile
 * @param profiles List of all profiles in the agency
 */
export function filterClientsByHierarchy<T extends { owner_id: string | null }>(
    clients: T[] | undefined | null,
    currentUser: Profile | undefined | null,
    profiles: Profile[] | undefined | null
): T[] {
    if (!currentUser || !profiles || !clients) return [];

    const subordinateIds = getSubordinateIds(currentUser.id, currentUser.role, profiles);
    const role = (currentUser.role || 'broker').toLowerCase();
    const isImobiliaria = role === 'admin' || role === 'imobiliaria' || role === 'imob';

    return clients.filter(client => {
        // Unassigned leads (Leads em espera / Disparo)
        if (!client.owner_id) {
            // ONLY Admin or Imobiliaria (the "Head") see unassigned leads
            return isImobiliaria;
        }

        // Assigned leads: must be the user themselves or one of their subordinates
        return subordinateIds.includes(client.owner_id);
    });
}

export function useClients() {
    return useQuery({
        queryKey: ['clients'],
        queryFn: async (): Promise<Client[]> => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) throw error;
            return data as Client[];
        },
    });
}

// Fetch a single client by ID
export function useClient(id: number | null) {
    return useQuery({
        queryKey: ['clients', id],
        queryFn: async (): Promise<Client | null> => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Client;
        },
        enabled: !!id,
    });
}

// Create a new client
export function useCreateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newClient: Partial<Client>) => {
            const { data, error } = await (supabase
                .from('clients') as any)
                .insert(newClient)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}

// Update a client
export function useUpdateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: Partial<Client> }) => {
            const { data, error } = await (supabase
                .from('clients') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}

// Delete a client
export function useDeleteClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}
