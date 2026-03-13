import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { AlertCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients, useUpdateClient, filterClientsByHierarchy } from '@/hooks/useClients';
import { useProfiles } from '@/hooks/useProfiles';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChatModal } from '@/components/chat/ChatModal';
import { AddClientModal } from '@/components/modals/AddClientModal';
import { toast } from 'sonner';
import { getOwnerName } from './utils/helpers';
import { KANBAN_COLUMNS } from './constantes';
import type { ViewMode } from './tipos';
import type { Client } from '@/lib/database.types';

// Hooks
import { useClientesPermissoes } from './hooks/useClientesPermissoes';
import { useClientesFiltros } from './hooks/useClientesFiltros';
import { useClientesRedistribuicao } from './hooks/useClientesRedistribuicao';

// Components
import { CabecalhoClientes } from './components/CabecalhoClientes';
import { KanbanClientes } from './components/KanbanClientes';
import { ListaClientes } from './components/ListaClientes';
import { RedistribuicaoClientes } from './components/RedistribuicaoClientes';
import { GraficosClientes } from './components/GraficosClientes';
import { ModalFiltros } from './components/ModalFiltros';

const Clientes = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [isAddClienteOpen, setIsAddClienteOpen] = useState(false);
    const [draggedClient, setDraggedClient] = useState<Client | null>(null);
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const clientIdParam = searchParams.get('client');

    // Data hooks
    const { data: clients, isLoading: isLoadingClients, error: clientsError } = useClients();
    const { data: profiles } = useProfiles();
    const { data: currentUser } = useCurrentUser();
    const updateClient = useUpdateClient();

    // Hierarchy privacy filter
    const safeClients = useMemo(() => {
        return filterClientsByHierarchy(clients, currentUser, profiles);
    }, [clients, currentUser, profiles]);

    // Leads sem dono
    const leadsEmEspera = useMemo(() => {
        return safeClients.filter(c => !c.owner_id);
    }, [safeClients]);

    // Custom hooks
    const permissions = useClientesPermissoes(currentUser);

    const filtrosHook = useClientesFiltros({
        clients,
        safeClients,
        profiles,
    });

    const redistribuicaoHook = useClientesRedistribuicao({
        clients,
        profiles,
        currentUser,
        updateClient,
        filteredClients: filtrosHook.filteredClients,
        leadsEmEspera,
        canRedistribute: permissions.canRedistribute,
    });

    // Set default view mode based on permissions
    useEffect(() => {
        if (currentUser) {
            const allowedViews: ViewMode[] = [];
            if (permissions.canViewKanban) allowedViews.push('kanban');
            if (permissions.canViewList) allowedViews.push('list');
            if (permissions.canViewCharts) allowedViews.push('charts');
            if (permissions.canRedistribute) allowedViews.push('redistribute');

            if (allowedViews.length > 0 && !allowedViews.includes(viewMode)) {
                setViewMode(allowedViews[0]);
            }
        }
    }, [currentUser, permissions.canViewKanban, permissions.canViewList, permissions.canViewCharts, permissions.canRedistribute]);

    // Open client modal from URL params
    useEffect(() => {
        if (clientIdParam) {
            let client = clients?.find(c => c.id === Number(clientIdParam)) || null;

            if (!client && location.state?.clientData) {
                client = location.state.clientData as any;
            }

            if (client) {
                setSelectedClient(client);
                setChatModalOpen(true);
            }
        }
    }, [clientIdParam, clients, location.state]);

    // Client click handler
    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setChatModalOpen(true);
    };

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, client: Client) => {
        setDraggedClient(client);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedClient) return;

        const oldStatus = draggedClient.status || 'lead';
        const oldIndex = KANBAN_COLUMNS.findIndex(c => c.key === oldStatus);
        const newIndex = KANBAN_COLUMNS.findIndex(c => c.key === newStatus);

        if (newIndex > oldIndex) {
            if (!permissions.canAdvanceStage) {
                toast.error('Você não tem permissão para avançar etapas.');
                return;
            }
        } else if (newIndex < oldIndex) {
            if (!permissions.canBackStage) {
                toast.error('Você não tem permissão para voltar etapas.');
                return;
            }
        }

        let dbStatus: string | null = newStatus;
        if (newStatus === 'disparo' && !draggedClient.status) dbStatus = null;

        try {
            await updateClient.mutateAsync({
                id: draggedClient.id,
                updates: { status: dbStatus },
            });
            toast.success(`Cliente movido para ${KANBAN_COLUMNS.find(c => c.key === newStatus)?.label}`);
        } catch (error: any) {
            console.error('Erro ao mover cliente:', error);
            toast.error(`Erro ao mover cliente: ${error.message || 'Erro desconhecido'}`);
        }
        setDraggedClient(null);
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (!permissions.canExport) {
            toast.error('Sem permissão para exportar');
            return;
        }
        const headers = ['Nome', 'Telefone', 'Status', 'Cidade', 'Bairro', 'Quartos', 'Tipo Imóvel', 'Modo Compra', 'Tipo Serviço', 'Declara IR', 'Renda', 'Responsável'];
        const rows = filtrosHook.filteredClients.map(c => [
            c.name || '',
            c.phone || '',
            c.status || 'lead',
            c.cidade || '',
            c.bairro || '',
            c.quartos || '',
            c.tipo_imovel || '',
            c.modo_compra || '',
            c.tipo_servico || '',
            c.declara_ir || '',
            c.renda || '',
            getOwnerName(c.owner_id, profiles),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Planilha exportada com sucesso!');
    };

    // Get fresh client data for ChatModal
    const activeClient = clients?.find(c => c.id === selectedClient?.id) || selectedClient;

    // Loading state
    if (isLoadingClients) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (clientsError) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-semibold">Erro ao carregar clientes</p>
                <p className="text-muted-foreground">{(clientsError as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <CabecalhoClientes
                viewMode={viewMode}
                setViewMode={setViewMode}
                filteredCount={filtrosHook.filteredClients.length}
                canViewKanban={permissions.canViewKanban}
                canViewList={permissions.canViewList}
                canViewCharts={permissions.canViewCharts}
                canRedistribute={permissions.canRedistribute}
                canExport={permissions.canExport}
                canUseFilters={permissions.canUseFilters}
                filtersOpen={filtrosHook.filtersOpen}
                setFiltersOpen={filtrosHook.setFiltersOpen}
                activeFiltersCount={filtrosHook.activeFiltersCount}
                leadsEmEspera={leadsEmEspera}
                handleExportCSV={handleExportCSV}
            />

            {/* View */}
            {viewMode === 'kanban' && (
                <KanbanClientes
                    filteredClients={filtrosHook.filteredClients}
                    draggedClient={draggedClient}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDraggedClient(null)}
                    onDrop={handleDrop}
                    onClientClick={handleClientClick}
                />
            )}

            {viewMode === 'list' && (
                <ListaClientes
                    filteredClients={filtrosHook.filteredClients}
                    searchTerm={filtrosHook.searchTerm}
                    setSearchTerm={filtrosHook.setSearchTerm}
                    onClientClick={handleClientClick}
                    profiles={profiles}
                />
            )}

            {viewMode === 'redistribute' && (
                <RedistribuicaoClientes
                    filteredClients={filtrosHook.filteredClients}
                    safeClients={safeClients}
                    brokers={redistribuicaoHook.brokers}
                    leadsEmEspera={leadsEmEspera}
                    selectedForRedistribute={redistribuicaoHook.selectedForRedistribute}
                    handleRedistributeSingle={redistribuicaoHook.handleRedistributeSingle}
                    handleRedistributeAll={redistribuicaoHook.handleRedistributeAll}
                    selectAllVisibleLeads={redistribuicaoHook.selectAllVisibleLeads}
                    clearSelection={redistribuicaoHook.clearSelection}
                    toggleSelection={redistribuicaoHook.toggleSelection}
                    updateClient={updateClient}
                    profiles={profiles}
                />
            )}

            {viewMode === 'charts' && (
                <GraficosClientes filteredClients={filtrosHook.filteredClients} />
            )}

            {/* Stats Footer */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Mostrando {filtrosHook.filteredClients.length} de {safeClients.length} clientes</span>
                {filtrosHook.activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={filtrosHook.clearFilters}>
                        <X className="w-3 h-3 mr-1" />
                        Limpar filtros
                    </Button>
                )}
            </div>

            {/* Filters Modal */}
            <ModalFiltros
                open={filtrosHook.filtersOpen}
                onOpenChange={filtrosHook.setFiltersOpen}
                filters={filtrosHook.filters}
                setFilters={filtrosHook.setFilters}
                getUniqueValues={filtrosHook.getUniqueValues}
                currentUser={currentUser}
                activeFiltersCount={filtrosHook.activeFiltersCount}
                clearFilters={filtrosHook.clearFilters}
                availableImob={filtrosHook.availableImob}
                availableDirectors={filtrosHook.availableDirectors}
                availableManagers={filtrosHook.availableManagers}
                availableCoordinators={filtrosHook.availableCoordinators}
                availableBrokersList={filtrosHook.availableBrokersList}
            />

            {/* Add Client Modal */}
            <AddClientModal
                open={isAddClienteOpen}
                onOpenChange={setIsAddClienteOpen}
            />

            {/* Chat Modal */}
            <ChatModal
                client={activeClient}
                open={chatModalOpen}
                onClose={() => {
                    setChatModalOpen(false);
                    setSelectedClient(null);
                }}
            />
        </div>
    );
};

export default Clientes;
