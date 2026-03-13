import { Plus, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EVENT_TYPES } from '../hooks/useAgenda';

interface HeaderAgendaProps {
    typeFilter: string;
    setTypeFilter: (v: string) => void;
    canUseFilters: boolean;
    canCreate: boolean;
    onOpenFilters: () => void;
    onNewEvent: () => void;
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    viewMode: 'month' | 'week' | 'day';
    handleViewModeChange: (mode: 'month' | 'week' | 'day') => void;
    canViewMonth: boolean;
    canViewWeek: boolean;
    canViewDay: boolean;
    todaysCount: number;
    totalCount: number;
    upcomingCount: number;
}

export function HeaderAgenda({
    typeFilter, setTypeFilter, canUseFilters, canCreate, onOpenFilters, onNewEvent,
    currentDate, setCurrentDate, viewMode, handleViewModeChange,
    canViewMonth, canViewWeek, canViewDay,
    todaysCount, totalCount, upcomingCount,
}: HeaderAgendaProps) {
    return (
        <>
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border border-pink-500/20 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-pink-500/20"><Calendar className="w-6 h-6 text-pink-500" /></div>
                        <div><h1 className="text-3xl font-black tracking-tight uppercase">Agenda</h1><p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{EVENT_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent></Select>
                        {canUseFilters && <Button variant="outline" onClick={onOpenFilters} className="rounded-xl"><Filter className="w-4 h-4 mr-2" />Filtros</Button>}
                        {canCreate && <Button className="bg-primary rounded-xl shadow-lg font-bold text-xs uppercase tracking-widest px-6" onClick={onNewEvent}><Plus className="w-4 h-4 mr-2" />Novo Compromisso</Button>}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="gtp-card p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Hoje</p><p className="text-3xl font-black text-primary">{todaysCount}</p></div>
                <div className="gtp-card p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Total</p><p className="text-3xl font-black text-purple-500">{totalCount}</p></div>
                <div className="gtp-card p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Próximos</p><p className="text-3xl font-black text-orange-500">{upcomingCount}</p></div>
                <div className="gtp-card p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Tipos</p><p className="text-3xl font-black text-blue-500">{EVENT_TYPES.length}</p></div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex gap-1 p-1 bg-background/50 rounded-xl border border-border/50">
                    {(['month', 'week', 'day'] as const).map(m => {
                        if (m === 'month' && !canViewMonth) return null;
                        if (m === 'week' && !canViewWeek) return null;
                        if (m === 'day' && !canViewDay) return null;
                        return (
                            <Button key={m} variant="ghost" size="sm" onClick={() => handleViewModeChange(m)} className={cn("rounded-lg", viewMode === m && "bg-primary text-white")}>
                                {m === 'month' ? 'Mês' : m === 'week' ? 'Semana' : 'Dia'}
                            </Button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <h2 className="text-xl font-black min-w-[200px] text-center capitalize">{format(currentDate, viewMode === 'day' ? "d 'de' MMMM" : 'MMMM yyyy', { locale: ptBR })}</h2>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setCurrentDate(new Date()); }}>Hoje</Button>
                </div>
            </div>
        </>
    );
}
