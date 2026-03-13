import { useState, useMemo } from 'react';
import { getSubordinateIds } from '@/hooks/useClients';
import { defaultFilters } from '../constantes';
import type { Filters } from '../tipos';
import type { Client } from '@/lib/database.types';

interface UseClientesFiltrosParams {
    clients: Client[] | undefined;
    safeClients: Client[];
    profiles: any[] | undefined;
}

export const useClientesFiltros = ({ clients, safeClients, profiles }: UseClientesFiltrosParams) => {
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const getUniqueValues = (field: keyof Client) => {
        const values = new Set<string>();
        clients?.forEach(c => {
            const val = c[field];
            if (val && typeof val === 'string') values.add(val);
        });
        return Array.from(values).sort();
    };

    // --- Cascading Hierarchy Lists ---
    const availableImob = useMemo(() => {
        return profiles?.filter(p => p.role === 'imobiliaria' || (p.role as string) === 'imob' || p.role === 'admin') || [];
    }, [profiles]);

    const availableDirectors = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'director') return false;
            if (filters.filter_imob_id && p.agency_id !== filters.filter_imob_id) return false;
            return true;
        }) || [];
    }, [profiles, filters.filter_imob_id]);

    const availableManagers = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'manager') return false;
            if (filters.filter_director_id && p.director_id !== filters.filter_director_id) return false;
            if (filters.filter_imob_id && p.agency_id !== filters.filter_imob_id) return false;
            return true;
        }) || [];
    }, [profiles, filters.filter_director_id, filters.filter_imob_id]);

    const availableCoordinators = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'coordinator') return false;
            if (filters.filter_manager_id && p.manager_id !== filters.filter_manager_id) return false;
            if (filters.filter_director_id && p.director_id !== filters.filter_director_id) return false;
            if (filters.filter_imob_id && p.agency_id !== filters.filter_imob_id) return false;
            return true;
        }) || [];
    }, [profiles, filters.filter_manager_id, filters.filter_director_id, filters.filter_imob_id]);

    const availableBrokersList = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'broker' && p.role !== 'corretor') return false;
            if (filters.filter_coordinator_id && p.coordinator_id !== filters.filter_coordinator_id) return false;
            if (filters.filter_manager_id && p.manager_id !== filters.filter_manager_id) return false;
            if (filters.filter_director_id && p.director_id !== filters.filter_director_id) return false;
            if (filters.filter_imob_id && p.agency_id !== filters.filter_imob_id) return false;
            return true;
        }) || [];
    }, [profiles, filters.filter_coordinator_id, filters.filter_manager_id, filters.filter_director_id, filters.filter_imob_id]);

    // Filter clients
    const filteredClients = safeClients.filter((client) => {
        // 1. Busca por texto
        const matchesSearch =
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone?.includes(searchTerm);

        if (!matchesSearch) return false;

        // 2. Filtros avançados
        const matchFilters =
            (!filters.cidade || client.cidade === filters.cidade) &&
            (!filters.bairro || client.bairro === filters.bairro) &&
            (!filters.quartos || client.quartos === filters.quartos) &&
            (!filters.tipo_imovel || client.tipo_imovel === filters.tipo_imovel) &&
            (!filters.modo_compra || client.modo_compra === filters.modo_compra) &&
            (!filters.tipo_servico || client.tipo_servico === filters.tipo_servico) &&
            (!filters.declara_ir || client.declara_ir === filters.declara_ir) &&
            (!filters.status || client.status === filters.status);

        if (!matchFilters) return false;

        // Hierarchy Specific ID Filtering
        const targetHierarchyId = filters.filter_broker_id ||
            filters.filter_coordinator_id ||
            filters.filter_manager_id ||
            filters.filter_director_id ||
            filters.filter_imob_id;

        if (targetHierarchyId) {
            const targetUser = profiles?.find(p => p.id === targetHierarchyId);
            if (targetUser) {
                const allowedIds = getSubordinateIds(targetUser.id, targetUser.role || 'broker', profiles || []);

                const isAssignedToHierarchy = client.owner_id && allowedIds.includes(client.owner_id);

                const isImobContext = targetUser.role === 'imobiliaria' || (targetUser.role as string) === 'imob' || targetUser.role === 'admin';
                const isWaitingLeadForContext = !client.owner_id && isImobContext && (
                    targetUser.role === 'admin' || client.agency_id === targetUser.id
                );

                if (!isAssignedToHierarchy && !isWaitingLeadForContext) return false;
            }
        } else if (filters.owner_id) {
            if (client.owner_id !== filters.owner_id) return false;
        }

        // 3. Filtro de Data
        if (filters.date_min || filters.date_max) {
            const clientDate = new Date(client.created_at);
            if (filters.date_min && clientDate < new Date(filters.date_min)) return false;
            if (filters.date_max) {
                const maxDate = new Date(filters.date_max);
                maxDate.setHours(23, 59, 59);
                if (clientDate > maxDate) return false;
            }
        }

        // 4. Filtro de Cargo do Responsável
        if (filters.responsavel_cargo && filters.responsavel_cargo !== 'all') {
            const owner = profiles?.find(p => p.id === client.owner_id);
            if (!owner || owner.role !== filters.responsavel_cargo) return false;
        }

        return true;
    });

    const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;
    const clearFilters = () => setFilters(defaultFilters);

    return {
        filters,
        setFilters,
        searchTerm,
        setSearchTerm,
        filtersOpen,
        setFiltersOpen,
        filteredClients,
        getUniqueValues,
        activeFiltersCount,
        clearFilters,
        availableImob,
        availableDirectors,
        availableManagers,
        availableCoordinators,
        availableBrokersList,
    };
};
