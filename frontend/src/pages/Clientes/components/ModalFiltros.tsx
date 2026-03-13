import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { KANBAN_COLUMNS } from '../constantes';
import type { Filters } from '../tipos';
import type { Client } from '@/lib/database.types';

interface ModalFiltrosProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: Filters;
    setFilters: (filters: Filters) => void;
    getUniqueValues: (field: keyof Client) => string[];
    currentUser: any;
    activeFiltersCount: number;
    clearFilters: () => void;
    availableImob: any[];
    availableDirectors: any[];
    availableManagers: any[];
    availableCoordinators: any[];
    availableBrokersList: any[];
}

export const ModalFiltros = ({
    open,
    onOpenChange,
    filters,
    setFilters,
    getUniqueValues,
    currentUser,
    activeFiltersCount,
    clearFilters,
    availableImob,
    availableDirectors,
    availableManagers,
    availableCoordinators,
    availableBrokersList,
}: ModalFiltrosProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-none shadow-2xl rounded-3xl">
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Filter className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">Filtros Avançados</DialogTitle>
                            <DialogDescription className="text-blue-100">Refine sua busca com precisão.</DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Coluna 1: Imóvel */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Características do Imóvel</h4>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Cidade</Label>
                                <Select value={filters.cidade || "ALL"} onValueChange={(v) => setFilters({ ...filters, cidade: v === "ALL" ? "" : v })}>
                                    <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todas</SelectItem>
                                        {getUniqueValues('cidade').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Bairro</Label>
                                <Select value={filters.bairro || "ALL"} onValueChange={(v) => setFilters({ ...filters, bairro: v === "ALL" ? "" : v })}>
                                    <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {getUniqueValues('bairro').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Quartos</Label>
                                    <Select value={filters.quartos || "ALL"} onValueChange={(v) => setFilters({ ...filters, quartos: v === "ALL" ? "" : v })}>
                                        <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todos</SelectItem>
                                            {getUniqueValues('quartos').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</Label>
                                    <Select value={filters.tipo_imovel || "ALL"} onValueChange={(v) => setFilters({ ...filters, tipo_imovel: v === "ALL" ? "" : v })}>
                                        <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todos</SelectItem>
                                            {getUniqueValues('tipo_imovel').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Cliente e Perfil */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Perfil do Cliente</h4>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</Label>
                                <Select value={filters.status || "ALL"} onValueChange={(v) => setFilters({ ...filters, status: v === "ALL" ? "" : v })}>
                                    <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {KANBAN_COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Modo Compra</Label>
                                <Select value={filters.modo_compra || "ALL"} onValueChange={(v) => setFilters({ ...filters, modo_compra: v === "ALL" ? "" : v })}>
                                    <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {getUniqueValues('modo_compra').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Declara IR</Label>
                                <Select value={filters.declara_ir || "ALL"} onValueChange={(v) => setFilters({ ...filters, declara_ir: v === "ALL" ? "" : v })}>
                                    <SelectTrigger className="h-9 rounded-lg border-muted bg-muted/20"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {getUniqueValues('declara_ir').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 3: Gestão e Data */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Gestão e Data</h4>
                        <div className="space-y-3">
                            {/* Hierarquia em Cascata */}
                            {currentUser?.role !== 'broker' && (
                                <div className="space-y-4 pt-2 border-t border-muted/30">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Filtro por Equipe</h5>

                                    {/* Imobiliária (Admin Only) */}
                                    {currentUser?.role === 'admin' && (
                                        <div>
                                            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Imobiliária</Label>
                                            <Select value={filters.filter_imob_id || "all"} onValueChange={(v) => setFilters({ ...filters, filter_imob_id: v === "all" ? "" : v, filter_director_id: '', filter_manager_id: '', filter_coordinator_id: '', filter_broker_id: '' })}>
                                                <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    {availableImob.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Diretor */}
                                    {['admin', 'imobiliaria', 'imob'].includes(currentUser?.role || '') && (
                                        <div>
                                            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Diretor</Label>
                                            <Select value={filters.filter_director_id || "all"} onValueChange={(v) => setFilters({ ...filters, filter_director_id: v === "all" ? "" : v, filter_manager_id: '', filter_coordinator_id: '', filter_broker_id: '' })}>
                                                <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableDirectors.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Gerente */}
                                    {['admin', 'imobiliaria', 'imob', 'director'].includes(currentUser?.role || '') && (
                                        <div>
                                            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Gerente</Label>
                                            <Select value={filters.filter_manager_id || "all"} onValueChange={(v) => setFilters({ ...filters, filter_manager_id: v === "all" ? "" : v, filter_coordinator_id: '', filter_broker_id: '' })}>
                                                <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableManagers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Coordenador */}
                                    {['admin', 'imobiliaria', 'imob', 'director', 'manager'].includes(currentUser?.role || '') && (
                                        <div>
                                            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Coordenador</Label>
                                            <Select value={filters.filter_coordinator_id || "all"} onValueChange={(v) => setFilters({ ...filters, filter_coordinator_id: v === "all" ? "" : v, filter_broker_id: '' })}>
                                                <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {availableCoordinators.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Corretor */}
                                    <div>
                                        <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Corretor</Label>
                                        <Select value={filters.filter_broker_id || "all"} onValueChange={(v) => setFilters({ ...filters, filter_broker_id: v === "all" ? "" : v })}>
                                            <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {availableBrokersList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Filtrar por Cargo</Label>
                                        <Select value={filters.responsavel_cargo || "all"} onValueChange={(v) => setFilters({ ...filters, responsavel_cargo: v })}>
                                            <SelectTrigger className="h-8 rounded-lg border-muted bg-muted/20 text-xs"><SelectValue placeholder="Qualquer Cargo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Qualquer Cargo</SelectItem>
                                                <SelectItem value="broker">Corretor</SelectItem>
                                                <SelectItem value="coordinator">Coordenador</SelectItem>
                                                <SelectItem value="manager">Gerente</SelectItem>
                                                <SelectItem value="director">Diretor</SelectItem>
                                                <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Data Mínima</Label>
                                <Input
                                    type="date"
                                    className="h-9 rounded-lg border-muted bg-muted/20"
                                    value={filters.date_min}
                                    onChange={(e) => setFilters({ ...filters, date_min: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Data Máxima</Label>
                                <Input
                                    type="date"
                                    className="h-9 rounded-lg border-muted bg-muted/20"
                                    value={filters.date_max}
                                    onChange={(e) => setFilters({ ...filters, date_max: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t flex justify-between items-center">
                    <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4 mr-2" /> Limpar Filtros
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8">
                            Aplicar Filtros ({activeFiltersCount})
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
