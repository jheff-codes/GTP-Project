import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { Contato } from '../components/UploadContatos';

interface DistribuicaoResultado {
    tabela: string;
    quantidade: number;
    sucesso: boolean;
    erro?: string;
}

export function useDisparos() {
    const [isDistributing, setIsDistributing] = useState(false);
    const [resultados, setResultados] = useState<DistribuicaoResultado[]>([]);

    const distribuir = useCallback(async (
        contatos: Contato[],
        tabelas: string[],
        agencyId: string
    ) => {
        if (contatos.length === 0 || tabelas.length === 0 || !agencyId) return;

        setIsDistributing(true);
        setResultados([]);

        try {
            // Round-robin division
            const batches: Contato[][] = Array.from({ length: tabelas.length }, () => []);
            contatos.forEach((contato, i) => {
                batches[i % tabelas.length].push(contato);
            });

            const results: DistribuicaoResultado[] = [];

            for (let i = 0; i < tabelas.length; i++) {
                const tableName = tabelas[i];
                const batch = batches[i];

                if (batch.length === 0) {
                    results.push({ tabela: tableName, quantidade: 0, sucesso: true });
                    continue;
                }

                const payload = batch.map(c => ({
                    name: c.name,
                    phone: c.phone,
                    stats: c.stats,
                    agency_id: agencyId,
                    created_at: new Date().toISOString(),
                }));

                try {
                    const { error } = await (supabase as any).from(tableName).insert(payload);
                    if (error) throw error;
                    results.push({ tabela: tableName, quantidade: batch.length, sucesso: true });
                } catch (err: any) {
                    results.push({ tabela: tableName, quantidade: batch.length, sucesso: false, erro: err.message });
                }
            }

            setResultados(results);

            const successCount = results.filter(r => r.sucesso).reduce((acc, r) => acc + r.quantidade, 0);
            const failCount = results.filter(r => !r.sucesso).reduce((acc, r) => acc + r.quantidade, 0);

            if (failCount === 0) {
                toast({ title: `✅ ${successCount} contatos distribuídos com sucesso!` });
            } else {
                toast({ title: `⚠️ ${successCount} inseridos, ${failCount} falharam.`, variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Erro na distribuição: ' + err.message, variant: 'destructive' });
        } finally {
            setIsDistributing(false);
        }
    }, []);

    const limpar = useCallback(() => {
        setResultados([]);
    }, []);

    return { distribuir, isDistributing, resultados, limpar };
}
