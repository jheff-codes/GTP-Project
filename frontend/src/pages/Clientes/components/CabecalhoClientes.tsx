import { Download, Filter, RefreshCw, LayoutGrid, List, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewMode } from '../tipos';
import type { Client } from '@/lib/database.types';

interface CabecalhoClientesProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    filteredCount: number;
    canViewKanban: boolean;
    canViewList: boolean;
    canViewCharts: boolean;
    canRedistribute: boolean;
    canExport: boolean;
    canUseFilters: boolean;
    filtersOpen: boolean;
    setFiltersOpen: (open: boolean) => void;
    activeFiltersCount: number;
    leadsEmEspera: Client[];
    handleExportCSV: () => void;
}

export const CabecalhoClientes = ({
    viewMode,
    setViewMode,
    filteredCount,
    canViewKanban,
    canViewList,
    canViewCharts,
    canRedistribute,
    canExport,
    canUseFilters,
    filtersOpen,
    setFiltersOpen,
    activeFiltersCount,
    leadsEmEspera,
    handleExportCSV,
}: CabecalhoClientesProps) => {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent border border-blue-500/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
                {/* Top Row: Title + Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 notranslate mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/20">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Leads</h1>
                            <p className="text-muted-foreground text-sm">{filteredCount} clientes encontrados</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-background/30 backdrop-blur-sm rounded-xl">
                            {canViewKanban && (
                                <Button
                                    variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('kanban')}
                                    className={cn("gap-2 rounded-lg", viewMode === 'kanban' && "bg-blue-500 text-white hover:bg-blue-600")}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Kanban
                                </Button>
                            )}
                            {canViewList && (
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className={cn("gap-2 rounded-lg", viewMode === 'list' && "bg-blue-500 text-white hover:bg-blue-600")}
                                >
                                    <List className="w-4 h-4" />
                                    Lista
                                </Button>
                            )}
                            {canViewCharts && (
                                <Button
                                    variant={viewMode === 'charts' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('charts')}
                                    className={cn("gap-2 rounded-lg", viewMode === 'charts' && "bg-blue-500 text-white hover:bg-blue-600")}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    Gráficos
                                </Button>
                            )}
                            {canRedistribute && (
                                <Button
                                    variant={viewMode === 'redistribute' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('redistribute')}
                                    className={cn("gap-2 rounded-lg", viewMode === 'redistribute' && "bg-blue-500 text-white hover:bg-blue-600")}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Redistribuição
                                    {leadsEmEspera.length > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                                            {leadsEmEspera.length}
                                        </span>
                                    )}
                                </Button>
                            )}
                        </div>

                        {canExport && (
                            <Button variant="outline" onClick={handleExportCSV} className="gap-2 rounded-xl backdrop-blur-sm bg-background/50 border-blue-500/20 hover:bg-blue-500/10">
                                <Download className="w-4 h-4" />
                                Exportar
                            </Button>
                        )}
                        {canUseFilters && (
                            <Button
                                variant={filtersOpen ? "secondary" : "outline"}
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className="gap-2 rounded-xl backdrop-blur-sm bg-background/50 border-blue-500/20 hover:bg-blue-500/10 relative"
                            >
                                <Filter className="w-4 h-4" />
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-lg shadow-blue-500/20">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
