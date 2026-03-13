import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type LogEntry, type LogCategory, isSystemLogEntry } from '../constantes';

interface UseLogsProps {
    currentUser: any;
    logAgencyFilter: string;
    activeLogCategory: LogCategory;
}

export function useLogs({ currentUser, logAgencyFilter, activeLogCategory }: UseLogsProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

    // ═══ Polling de Logs (5s) ═══
    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') return;

        async function fetchLogs() {
            try {
                let query = (supabase as any)
                    .from('logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(2000);

                if (logAgencyFilter !== 'all') {
                    query = query.eq('agency_id', logAgencyFilter);
                }

                switch (activeLogCategory) {
                    case 'automation':
                        query = query.eq('category', 'ENGINE_AI');
                        break;
                    case 'system':
                        query = query.eq('category', 'SISTEMA');
                        break;
                    case 'error':
                        query = query.eq('level', 'ERROR');
                        break;
                    case 'login':
                        query = query.eq('category', 'ACESSO');
                        break;
                    case 'checkin':
                        query = query.eq('category', 'PONTO');
                        break;
                    case 'redistribution':
                        query = query.eq('category', 'REDIST');
                        break;
                    case 'dispatch':
                        query = query.eq('category', 'DISPAROS');
                        break;
                    case 'notification':
                        query = query.eq('category', 'NOTIF');
                        break;
                }

                const { data } = await query;

                if (data) {
                    setLogs(data.map((d: any) => ({
                        ...d,
                        source: isSystemLogEntry(d.message) ? 'system' as const : 'automation' as const
                    })));
                }
            } catch (err) {
                console.error('Falha ao buscar logs:', err);
            }
        }

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [currentUser, logAgencyFilter, activeLogCategory]);

    const filteredLogs = logs.filter(l =>
        l.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentSearchIndex(0);
    };

    const handleSearchPrev = () => {
        setCurrentSearchIndex(prev => Math.max(0, prev - 1));
    };

    const handleSearchNext = () => {
        setCurrentSearchIndex(prev => Math.min(filteredLogs.length - 1, prev + 1));
    };

    return {
        logs: filteredLogs,
        totalLogs: filteredLogs.length,
        searchQuery,
        currentSearchIndex,
        handleSearchChange,
        handleSearchPrev,
        handleSearchNext,
    };
}
