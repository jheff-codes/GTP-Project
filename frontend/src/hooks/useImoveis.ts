import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Imovel } from '@/lib/database.types';

// Fetch all imoveis
export function useImoveis() {
    return useQuery({
        queryKey: ['imoveis'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('imoveis')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Imovel[];
        },
    });
}

// Fetch a single imovel by ID
export function useImovel(id: number | null) {
    return useQuery({
        queryKey: ['imoveis', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('imoveis')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Imovel;
        },
        enabled: !!id,
    });
}

// Create a new imovel
export function useCreateImovel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newImovel: Partial<Imovel>) => {
            const { data, error } = await supabase
                .from('imoveis')
                .insert(newImovel)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imoveis'] });
        },
    });
}

// Update an imovel
export function useUpdateImovel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: Partial<Imovel> }) => {
            const { data, error } = await supabase
                .from('imoveis')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imoveis'] });
        },
    });
}

// Delete an imovel
export function useDeleteImovel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('imoveis')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imoveis'] });
        },
    });
}
