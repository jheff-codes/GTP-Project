import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { AUTOMATIONS, type Agency, type ViewMode, type LogCategory } from '../constantes';

export function useDesenvolvedor() {
    const { data: currentUser, isLoading: userLoading } = useCurrentUser();

    // Navegação
    const [activeAutomation, setActiveAutomation] = useState(AUTOMATIONS[0].id);
    const [viewMode, setViewMode] = useState<ViewMode>('config');
    const [showErrorAlertPanel, setShowErrorAlertPanel] = useState(false);

    // Escopo Global/Unidade
    const [isGlobal, setIsGlobal] = useState(true);
    const [selectedAgency, setSelectedAgency] = useState<string>('all');

    // Logs
    const [logAgencyFilter, setLogAgencyFilter] = useState<string>('all');
    const [activeLogCategory, setActiveLogCategory] = useState<LogCategory>('all');

    // Agências
    const [agencies, setAgencies] = useState<Agency[]>([]);

    useEffect(() => {
        async function loadAgencies() {
            try {
                const { data } = await (supabase as any)
                    .from('profiles')
                    .select('id, name')
                    .or('role.eq.imobiliaria,role.eq.admin')
                    .order('name');
                if (data) setAgencies(data);
            } catch (err) {
                console.error('Erro ao carregar agências:', err);
            }
        }
        if (!userLoading) loadAgencies();
    }, [userLoading]);

    const selectAutomation = (id: string) => {
        setActiveAutomation(id);
        setShowErrorAlertPanel(false);
    };

    return {
        currentUser,
        userLoading,
        activeAutomation,
        selectAutomation,
        viewMode,
        setViewMode,
        showErrorAlertPanel,
        setShowErrorAlertPanel,
        isGlobal,
        setIsGlobal,
        selectedAgency,
        setSelectedAgency,
        logAgencyFilter,
        setLogAgencyFilter,
        activeLogCategory,
        setActiveLogCategory,
        agencies,
    };
}
