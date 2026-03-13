import { useState, useMemo } from 'react';
import { getSubordinateIds } from '@/hooks/useClients';
import { MONTHS } from '../constantes';
import type { Client, Profile } from '@/lib/database.types';

interface UseDashboardFiltrosParams {
    safeClients: Client[];
    profiles: Profile[] | undefined;
    currentUser: any;
}

export const useDashboardFiltros = ({ safeClients, profiles, currentUser }: UseDashboardFiltrosParams) => {
    // Filter state
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterImobiliaria, setFilterImobiliaria] = useState<string>('all');
    const [filterDirector, setFilterDirector] = useState<string>('all');
    const [filterManager, setFilterManager] = useState<string>('all');
    const [filterCoordinator, setFilterCoordinator] = useState<string>('all');
    const [filterBroker, setFilterBroker] = useState<string>('all');

    // Available months/years based on existing data
    const { availableMonths, availableYears } = useMemo(() => {
        const monthSet = new Set<string>();
        const yearSet = new Set<string>();

        safeClients?.forEach(client => {
            if (client.created_at) {
                const date = new Date(client.created_at);
                monthSet.add(String(date.getMonth() + 1));
                yearSet.add(String(date.getFullYear()));
            }
        });

        const months = MONTHS.filter(m => monthSet.has(m.value));
        const years = Array.from(yearSet)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(y => ({ value: y, label: y }));

        return { availableMonths: months, availableYears: years };
    }, [safeClients]);

    // Cascading hierarchy lists
    const availableImobiliarias = useMemo(() => {
        return profiles?.filter(p => p.role === 'imobiliaria' || (p.role as string) === 'imob' || p.role === 'admin') || [];
    }, [profiles]);

    const availableDirectors = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'director') return false;
            if (filterImobiliaria !== 'all' && p.agency_id !== filterImobiliaria) return false;
            return true;
        }) || [];
    }, [profiles, filterImobiliaria]);

    const availableManagers = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'manager') return false;
            if (filterDirector !== 'all' && p.director_id !== filterDirector) return false;
            if (filterImobiliaria !== 'all' && p.agency_id !== filterImobiliaria) return false;
            return true;
        }) || [];
    }, [profiles, filterDirector, filterImobiliaria]);

    const availableCoordinators = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'coordinator') return false;
            if (filterManager !== 'all' && p.manager_id !== filterManager) return false;
            if (filterDirector !== 'all' && p.director_id !== filterDirector) return false;
            if (filterImobiliaria !== 'all' && p.agency_id !== filterImobiliaria) return false;
            return true;
        }) || [];
    }, [profiles, filterManager, filterDirector, filterImobiliaria]);

    const availableBrokers = useMemo(() => {
        return profiles?.filter(p => {
            if (p.role !== 'broker' && (p.role as string) !== 'corretor') return false;
            if (filterCoordinator !== 'all' && p.coordinator_id !== filterCoordinator) return false;
            if (filterManager !== 'all' && p.manager_id !== filterManager) return false;
            if (filterDirector !== 'all' && p.director_id !== filterDirector) return false;
            if (filterImobiliaria !== 'all' && p.agency_id !== filterImobiliaria) return false;
            return true;
        }) || [];
    }, [profiles, filterCoordinator, filterManager, filterDirector, filterImobiliaria]);

    // Apply all filters to clients
    const filteredClients = useMemo(() => {
        if (!safeClients) return [];
        return safeClients.filter(client => {
            // Month filter
            if (filterMonth && filterMonth !== 'all' && client.created_at) {
                const clientMonth = new Date(client.created_at).getMonth() + 1;
                if (clientMonth !== parseInt(filterMonth)) return false;
            }
            // Year filter
            if (filterYear && filterYear !== 'all' && client.created_at) {
                const clientYear = new Date(client.created_at).getFullYear();
                if (clientYear !== parseInt(filterYear)) return false;
            }

            // Cascading hierarchy filter
            const targetHierarchyId = filterBroker !== 'all' ? filterBroker :
                filterCoordinator !== 'all' ? filterCoordinator :
                    filterManager !== 'all' ? filterManager :
                        filterDirector !== 'all' ? filterDirector :
                            filterImobiliaria !== 'all' ? filterImobiliaria : null;

            if (targetHierarchyId) {
                const targetUser = profiles?.find(p => p.id === targetHierarchyId);
                if (targetUser) {
                    const allowedIds = getSubordinateIds(targetUser.id, targetUser.role || 'broker', profiles || []);

                    const isAssignedToHierarchy = client.owner_id && allowedIds.includes(client.owner_id);
                    const isImobContext = targetUser.role === 'imobiliaria' || (targetUser.role as string) === 'imob' || targetUser.role === 'admin';
                    const isWaitingLeadForContext = !client.owner_id && isImobContext && (
                        targetUser.role === 'admin' || (client as any).agency_id === targetUser.id
                    );

                    if (!isAssignedToHierarchy && !isWaitingLeadForContext) return false;
                }
            }

            return true;
        });
    }, [safeClients, filterMonth, filterYear, filterImobiliaria, filterDirector, filterManager, filterCoordinator, filterBroker, profiles]);

    // Active filters count
    const activeFiltersCount = [filterMonth, filterYear, filterImobiliaria, filterDirector, filterManager, filterCoordinator, filterBroker]
        .filter(f => f && f !== 'all').length;

    // Clear all filters
    const clearFilters = () => {
        setFilterMonth('all');
        setFilterYear('all');
        setFilterImobiliaria('all');
        setFilterDirector('all');
        setFilterManager('all');
        setFilterCoordinator('all');
        setFilterBroker('all');
    };

    // Setters with cascading reset
    const setImobiliaria = (v: string) => {
        setFilterImobiliaria(v);
        setFilterDirector('all');
        setFilterManager('all');
        setFilterCoordinator('all');
        setFilterBroker('all');
    };

    const setDirector = (v: string) => {
        setFilterDirector(v);
        setFilterManager('all');
        setFilterCoordinator('all');
        setFilterBroker('all');
    };

    const setManager = (v: string) => {
        setFilterManager(v);
        setFilterCoordinator('all');
        setFilterBroker('all');
    };

    const setCoordinator = (v: string) => {
        setFilterCoordinator(v);
        setFilterBroker('all');
    };

    return {
        // State
        filterMonth,
        filterYear,
        filterImobiliaria,
        filterDirector,
        filterManager,
        filterCoordinator,
        filterBroker,

        // Setters
        setFilterMonth,
        setFilterYear,
        setImobiliaria,
        setDirector,
        setManager,
        setCoordinator,
        setFilterBroker,

        // Available options
        availableMonths,
        availableYears,
        availableImobiliarias,
        availableDirectors,
        availableManagers,
        availableCoordinators,
        availableBrokers,

        // Filtered result
        filteredClients,

        // Helpers
        activeFiltersCount,
        clearFilters,
    };
};
