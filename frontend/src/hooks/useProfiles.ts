import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';

// Fetch all profiles
export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Profile[];
        },
    });
}

// Fetch a single profile by ID
export function useProfile(id: string | null) {
    return useQuery({
        queryKey: ['profiles', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!id,
    });
}

// Fetch profiles by role
export function useProfilesByRole(role: string) {
    return useQuery({
        queryKey: ['profiles', 'role', role],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', role)
                .order('name');

            if (error) throw error;
            return data as Profile[];
        },
        enabled: !!role,
    });
}

// Update a profile
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });
}
