import { useState, useMemo } from 'react';
import { useClients, filterClientsByHierarchy } from '@/hooks/useClients';
import { useImoveis } from '@/hooks/useImoveis';
import { useEvents } from '@/hooks/useEvents';
import { useProfiles } from '@/hooks/useProfiles';
import { useRecentChatMessages } from '@/hooks/useChatMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatModal } from '@/components/chat/ChatModal';
import type { Client } from '@/lib/database.types';

// Hook
import { useDashboardFiltros } from './hooks/useDashboardFiltros';

// Components
import { CabecalhoDashboard } from './components/CabecalhoDashboard';
import { CardsKpi } from './components/CardsKpi';
import { FunilVendas } from './components/FunilVendas';
import { UltimasConversas } from './components/UltimasConversas';
import { TopCorretores } from './components/TopCorretores';
import { LeadsPorOrigem } from './components/LeadsPorOrigem';

const Dashboard = () => {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Data hooks
    const { data: clients, isLoading: isLoadingClients } = useClients();
    const { data: imoveis, isLoading: isLoadingImoveis } = useImoveis();
    const { data: events, isLoading: isLoadingEvents } = useEvents();
    const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();
    const { data: recentMessages, isLoading: isLoadingMessages } = useRecentChatMessages(300);
    const { data: currentUser } = useCurrentUser();

    // Query leads for Disparo stats
    const { data: allLeadsByPrefix } = useQuery({
        queryKey: ['allLeadsByPrefix'],
        queryFn: async (): Promise<{ id: number; prefix: string | null; status: string | null; origin: string | null; owner_id: string | null }[]> => {
            const { data, error } = await supabase
                .from('clients')
                .select('id, prefix, status, origin, owner_id')
                .limit(10000);

            if (error) throw error;
            return (data || []) as { id: number; prefix: string | null; status: string | null; origin: string | null; owner_id: string | null }[];
        },
    });

    // Security filter: hierarchy-based privacy
    const safeClients = useMemo(() => {
        return filterClientsByHierarchy(clients, currentUser, profiles);
    }, [clients, currentUser, profiles]);

    const safeAllLeads = useMemo(() => {
        return filterClientsByHierarchy(allLeadsByPrefix, currentUser, profiles);
    }, [allLeadsByPrefix, currentUser, profiles]);

    // Group leads by origin
    const leadsByOrigin = useMemo(() => {
        const grouped: Record<string, number> = {};
        safeAllLeads.forEach(client => {
            const origin = client.origin || 'Desconhecido';
            const label = client.prefix ? `${client.prefix} - ${origin}` : origin;
            grouped[label] = (grouped[label] || 0) + 1;
        });
        return grouped;
    }, [safeAllLeads]);

    const totalLeadsDisparo = safeAllLeads.length;

    // Filters hook
    const filtros = useDashboardFiltros({
        safeClients,
        profiles,
        currentUser,
    });

    // Derived metrics from filteredClients
    const totalClients = filtros.filteredClients.length;
    const totalImoveis = imoveis?.length || 0;
    const visitasCount = events?.filter(e => e.type === 'visita').length || 0;
    const vendasCount = filtros.filteredClients.filter(c => c.status?.toLowerCase() === 'venda').length;
    const conversionRate = totalClients > 0 ? ((vendasCount / totalClients) * 100).toFixed(1) : '0';

    // Month-over-month change
    const monthChange = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthCount = safeClients.filter(c => {
            const d = new Date(c.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const lastMonthCount = safeClients.filter(c => {
            const d = new Date(c.created_at);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }).length;

        if (lastMonthCount === 0) return currentMonthCount > 0 ? 100 : 0;
        return Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    }, [safeClients]);

    // Client click handler
    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setChatModalOpen(true);
    };

    // Loading state
    const isLoading = isLoadingClients || isLoadingImoveis || isLoadingEvents || isLoadingProfiles;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    // Permission checks
    const canViewTopCorretores = currentUser?.parsedPermissions?.dashboard?.view_top_corretores !== false;
    const canViewLeadsOciosos = currentUser?.parsedPermissions?.dashboard?.view_leads_ociosos !== false;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header + Filters */}
            <CabecalhoDashboard
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                activeFiltersCount={filtros.activeFiltersCount}
                clearFilters={filtros.clearFilters}
                filterMonth={filtros.filterMonth}
                filterYear={filtros.filterYear}
                filterImobiliaria={filtros.filterImobiliaria}
                filterDirector={filtros.filterDirector}
                filterManager={filtros.filterManager}
                filterCoordinator={filtros.filterCoordinator}
                filterBroker={filtros.filterBroker}
                setFilterMonth={filtros.setFilterMonth}
                setFilterYear={filtros.setFilterYear}
                setImobiliaria={filtros.setImobiliaria}
                setDirector={filtros.setDirector}
                setManager={filtros.setManager}
                setCoordinator={filtros.setCoordinator}
                setFilterBroker={filtros.setFilterBroker}
                availableMonths={filtros.availableMonths}
                availableYears={filtros.availableYears}
                availableImobiliarias={filtros.availableImobiliarias}
                availableDirectors={filtros.availableDirectors}
                availableManagers={filtros.availableManagers}
                availableCoordinators={filtros.availableCoordinators}
                availableBrokers={filtros.availableBrokers}
                currentUserRole={currentUser?.role || null}
            />

            {/* KPI Cards */}
            <CardsKpi
                totalClients={totalClients}
                totalImoveis={totalImoveis}
                visitasCount={visitasCount}
                conversionRate={conversionRate}
                totalLeadsDisparo={totalLeadsDisparo}
                monthChange={monthChange}
            />

            {/* Funnel + Conversations Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                <FunilVendas filteredClients={filtros.filteredClients} />

                <UltimasConversas
                    filteredClients={filtros.filteredClients}
                    recentMessages={recentMessages}
                    profiles={profiles}
                    isLoading={isLoadingMessages}
                    onClientClick={handleClientClick}
                />
            </div>

            {/* Top Corretores + Leads por Origem */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TopCorretores
                        availableBrokers={filtros.availableBrokers}
                        filteredClients={filtros.filteredClients}
                        filterImobiliaria={filtros.filterImobiliaria}
                        hasPermission={canViewTopCorretores}
                    />
                </div>

                <div className="lg:col-span-1">
                    <LeadsPorOrigem
                        leadsByOrigin={leadsByOrigin}
                        totalLeadsDisparo={totalLeadsDisparo}
                        hasPermission={canViewLeadsOciosos}
                    />
                </div>
            </div>

            {/* Chat Modal */}
            <ChatModal
                client={selectedClient}
                open={chatModalOpen}
                onClose={() => {
                    setChatModalOpen(false);
                    setSelectedClient(null);
                }}
            />
        </div>
    );
};

export default Dashboard;
