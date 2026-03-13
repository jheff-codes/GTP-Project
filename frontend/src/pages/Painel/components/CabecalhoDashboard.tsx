import { TrendingUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';

interface CabecalhoDashboardProps {
    filtersOpen: boolean;
    setFiltersOpen: (open: boolean) => void;
    activeFiltersCount: number;
    clearFilters: () => void;
    // Filter values
    filterMonth: string;
    filterYear: string;
    filterImobiliaria: string;
    filterDirector: string;
    filterManager: string;
    filterCoordinator: string;
    filterBroker: string;
    // Setters
    setFilterMonth: (v: string) => void;
    setFilterYear: (v: string) => void;
    setImobiliaria: (v: string) => void;
    setDirector: (v: string) => void;
    setManager: (v: string) => void;
    setCoordinator: (v: string) => void;
    setFilterBroker: (v: string) => void;
    // Available options
    availableMonths: { value: string; label: string }[];
    availableYears: { value: string; label: string }[];
    availableImobiliarias: any[];
    availableDirectors: any[];
    availableManagers: any[];
    availableCoordinators: any[];
    availableBrokers: any[];
    // Current user for conditional rendering
    currentUserRole: string | null;
}

export const CabecalhoDashboard = ({
    filtersOpen,
    setFiltersOpen,
    activeFiltersCount,
    clearFilters,
    filterMonth,
    filterYear,
    filterImobiliaria,
    filterDirector,
    filterManager,
    filterCoordinator,
    filterBroker,
    setFilterMonth,
    setFilterYear,
    setImobiliaria,
    setDirector,
    setManager,
    setCoordinator,
    setFilterBroker,
    availableMonths,
    availableYears,
    availableImobiliarias,
    availableDirectors,
    availableManagers,
    availableCoordinators,
    availableBrokers,
    currentUserRole,
}: CabecalhoDashboardProps) => {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/20">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Visão geral do sistema</p>
                    </div>
                </div>

                {/* Filter Sheet */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="rounded-xl bg-background/50 gap-2">
                            <Filter className="w-4 h-4" />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Filtros do Dashboard</SheetTitle>
                            <SheetDescription>Refine a visualização dos dados</SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 py-6">
                            {/* Ano */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ano</label>
                                <Select value={filterYear} onValueChange={setFilterYear}>
                                    <SelectTrigger><SelectValue placeholder="Todos os anos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os anos</SelectItem>
                                        {availableYears.map(year => (
                                            <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mês */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mês</label>
                                <Select value={filterMonth} onValueChange={setFilterMonth}>
                                    <SelectTrigger><SelectValue placeholder="Todos os meses" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os meses</SelectItem>
                                        {availableMonths.map(month => (
                                            <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtros de Equipe - Escondidos para Corretores */}
                            {currentUserRole !== 'broker' && (
                                <>
                                    {/* Imobiliária (Admin) */}
                                    {currentUserRole === 'admin' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Imobiliária</label>
                                            <Select value={filterImobiliaria} onValueChange={setImobiliaria}>
                                                <SelectTrigger><SelectValue placeholder="Todas as imobiliárias" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    {availableImobiliarias.map(imob => (
                                                        <SelectItem key={imob.id} value={imob.id || 'unknown'}>{imob.name || 'Sem nome'}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Diretor */}
                                    {['admin', 'imobiliaria', 'imob'].includes(currentUserRole || '') && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diretor</label>
                                            <Select value={filterDirector} onValueChange={setDirector}>
                                                <SelectTrigger><SelectValue placeholder="Todos os diretores" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableDirectors.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name || 'Sem nome'}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Gerente */}
                                    {['admin', 'imobiliaria', 'imob', 'director'].includes(currentUserRole || '') && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gerente</label>
                                            <Select value={filterManager} onValueChange={setManager}>
                                                <SelectTrigger><SelectValue placeholder="Todos os gerentes" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableManagers.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name || 'Sem nome'}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Coordenador */}
                                    {['admin', 'imobiliaria', 'imob', 'director', 'manager'].includes(currentUserRole || '') && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coordenador</label>
                                            <Select value={filterCoordinator} onValueChange={setCoordinator}>
                                                <SelectTrigger><SelectValue placeholder="Todos os coordenadores" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableCoordinators.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name || 'Sem nome'}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Corretor */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corretor</label>
                                        <Select value={filterBroker} onValueChange={setFilterBroker}>
                                            <SelectTrigger><SelectValue placeholder="Todos os corretores" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {availableBrokers.map(broker => (
                                                    <SelectItem key={broker.id} value={broker.id}>{broker.name || 'Sem nome'}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <Button variant="destructive" className="w-full" onClick={clearFilters}>
                                Limpar Filtros
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
};
