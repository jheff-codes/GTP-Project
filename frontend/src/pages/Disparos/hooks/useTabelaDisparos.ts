import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface ContatoTabela {
    id: number;
    name: string;
    phone: string;
    stats: string;
    agency_id: string | null;
    created_at: string;
    [key: string]: any;
}

export function useTabelaDisparos() {
    const [dados, setDados] = useState<ContatoTabela[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');

    const fetchDados = useCallback(async (nomeTabela: string) => {
        if (!nomeTabela) { setDados([]); return; }
        setLoading(true);
        setSelectedTable(nomeTabela);
        try {
            const { data, error } = await (supabase as any)
                .from(nomeTabela)
                .select('*')
                .order('id', { ascending: true });
            if (error) throw error;
            setDados(data || []);
        } catch (err: any) {
            toast({ title: `Erro ao carregar ${nomeTabela}: ${err.message}`, variant: 'destructive' });
            setDados([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const atualizarContato = useCallback(async (nomeTabela: string, id: number, payload: Partial<ContatoTabela>) => {
        try {
            const { error } = await (supabase as any)
                .from(nomeTabela)
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            setDados(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
            toast({ title: 'Contato atualizado!' });
        } catch (err: any) {
            toast({ title: `Erro: ${err.message}`, variant: 'destructive' });
        }
    }, []);

    const excluirContato = useCallback(async (nomeTabela: string, id: number) => {
        try {
            const { error } = await (supabase as any)
                .from(nomeTabela)
                .delete()
                .eq('id', id);
            if (error) throw error;
            setDados(prev => prev.filter(c => c.id !== id));
            toast({ title: 'Contato excluído.' });
        } catch (err: any) {
            toast({ title: `Erro: ${err.message}`, variant: 'destructive' });
        }
    }, []);

    const excluirEmMassa = useCallback(async (nomeTabela: string, ids: number[]) => {
        if (ids.length === 0) return;
        try {
            const { error } = await (supabase as any)
                .from(nomeTabela)
                .delete()
                .in('id', ids);
            if (error) throw error;
            setDados(prev => prev.filter(c => !ids.includes(c.id)));
            toast({ title: `${ids.length} contato${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''}.` });
        } catch (err: any) {
            toast({ title: `Erro: ${err.message}`, variant: 'destructive' });
        }
    }, []);

    return {
        dados,
        loading,
        selectedTable,
        fetchDados,
        atualizarContato,
        excluirContato,
        excluirEmMassa,
    };
}
