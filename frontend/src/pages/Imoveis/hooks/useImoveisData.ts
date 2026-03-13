import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useImoveis } from '@/hooks/useImoveis';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export function useImoveisData() {
    const queryClient = useQueryClient();
    const { data: imoveis = [], isLoading, error } = useImoveis();

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['imoveis'] });
    }, [queryClient]);

    const confirmDelete = useCallback(async (id: number) => {
        try {
            const { error } = await supabase.from('imoveis').delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Imóvel removido.', variant: 'default' });
            invalidate();
        } catch {
            toast({ title: 'Erro ao excluir.', variant: 'destructive' });
        }
    }, [invalidate]);

    return {
        imoveis,
        isLoading,
        error,
        invalidate,
        confirmDelete,
    };
}
