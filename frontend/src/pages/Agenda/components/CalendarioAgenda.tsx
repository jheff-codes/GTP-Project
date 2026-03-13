import { Plus, Calendar, Clock, MoreVertical, Trash2, Edit, MapPin, Video, Phone, Users, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Event } from '@/lib/database.types';

const ICON_MAP: Record<string, any> = { MapPin, Video, Phone, Users, Briefcase, Heart };

const EVENT_TYPES_LOCAL = [
    { key: 'presencial', label: 'Visita Presencial', icon: MapPin, color: 'bg-emerald-500' },
    { key: 'video', label: 'Vídeo Chamada', icon: Video, color: 'bg-blue-500' },
    { key: 'ligacao', label: 'Ligação Telefônica', icon: Phone, color: 'bg-yellow-500' },
    { key: 'reuniao_interna', label: 'Reunião Interna', icon: Users, color: 'bg-purple-500' },
    { key: 'evento_corporativo', label: 'Evento Corporativo', icon: Briefcase, color: 'bg-orange-500' },
    { key: 'compromisso_pessoal', label: 'Compromisso Pessoal', icon: Heart, color: 'bg-pink-500' },
];

const getEventTypeConfig = (type: string) => EVENT_TYPES_LOCAL.find(t => t.key === type) || EVENT_TYPES_LOCAL[0];

interface CalendarioAgendaProps {
    viewMode: 'month' | 'week' | 'day';
    canViewMonth: boolean;
    canViewWeek: boolean;
    canViewDay: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    daysInMonth: Date[];
    paddedDays: null[];
    weekDays: Date[];
    currentDate: Date;
    selectedDates: Date[];
    getEventsForDate: (date: Date) => Event[];
    onDayMouseDown: (day: Date) => void;
    onDayMouseEnter: (day: Date) => void;
    onEventClick: (event: Event) => void;
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (event: Event) => void;
    onNewEvent: () => void;
}

function EventCard({ event, canEdit, canDelete, onEventClick, onEditEvent, onDeleteEvent }: {
    event: Event; canEdit: boolean; canDelete: boolean;
    onEventClick: (e: Event) => void; onEditEvent: (e: Event) => void; onDeleteEvent: (e: Event) => void;
}) {
    const cfg = getEventTypeConfig(event.type || 'presencial');
    const Icon = cfg.icon;
    return (
        <div key={event.id} className={cn("group relative p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105", cfg.color, "text-white shadow-sm")} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
            <div className="flex items-center gap-1"><Icon className="w-3 h-3" /><span className="truncate font-medium">{event.title}</span></div>
            {event.start_time && <div className="text-[10px] opacity-80 mt-0.5">{event.start_time}</div>}
            {(canEdit || canDelete) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"><MoreVertical className="w-3 h-3" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && <DropdownMenuItem onClick={e => { e.stopPropagation(); onEditEvent(event); }}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>}
                        {canDelete && <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDeleteEvent(event); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

export function CalendarioAgenda(props: CalendarioAgendaProps) {
    const { viewMode, canViewMonth, canViewWeek, canViewDay, canCreate, canEdit, canDelete,
        daysInMonth, paddedDays, weekDays, currentDate, selectedDates,
        getEventsForDate, onDayMouseDown, onDayMouseEnter, onEventClick, onEditEvent, onDeleteEvent, onNewEvent } = props;

    return (
        <div className="lg:col-span-3 rounded-[2rem] border border-border/50 bg-card/50 overflow-hidden shadow-lg">
            {/* Month View */}
            {viewMode === 'month' && canViewMonth && (
                <>
                    <div className="grid grid-cols-7 bg-muted/30 border-b">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="py-4 text-center text-[10px] font-black uppercase text-muted-foreground">{d}</div>)}</div>
                    <div className="grid grid-cols-7">
                        {paddedDays.map((_, i) => <div key={`p-${i}`} className="min-h-[120px] border-b border-r border-border/30 bg-muted/10" />)}
                        {daysInMonth.map(day => {
                            const dayEvents = getEventsForDate(day);
                            const isToday = isSameDay(day, new Date());
                            const isSelected = selectedDates.some(d => isSameDay(d, day));
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "min-h-[120px] border-b border-r border-border/30 p-2 cursor-pointer select-none transition-all",
                                        isToday && "bg-gradient-to-br from-primary/10 to-transparent",
                                        isSelected && "bg-primary/20 ring-2 ring-primary/50 ring-inset",
                                        !isSelected && "hover:bg-muted/30"
                                    )}
                                    onMouseDown={() => onDayMouseDown(day)}
                                    onMouseEnter={() => onDayMouseEnter(day)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={cn("w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold", isToday && "bg-primary text-white shadow-lg")}>{format(day, 'd')}</div>
                                        {dayEvents.length > 0 && <span className="text-[10px] font-bold bg-muted/50 px-1.5 rounded-full">{dayEvents.length}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map(e => <EventCard key={e.id} event={e} canEdit={canEdit} canDelete={canDelete} onEventClick={onEventClick} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />)}
                                        {dayEvents.length > 2 && <p className="text-[10px] text-primary font-bold text-center">+{dayEvents.length - 2}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Week View */}
            {viewMode === 'week' && canViewWeek && (
                <div className="grid grid-cols-7 divide-x min-h-[600px]">
                    {weekDays.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} className="flex flex-col">
                                <div className={cn("p-4 text-center border-b", isToday && "bg-primary/10")}><div className="text-[10px] font-black uppercase text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div><div className={cn("w-10 h-10 mx-auto mt-2 flex items-center justify-center rounded-xl font-black", isToday && "bg-primary text-white")}>{format(day, 'd')}</div></div>
                                <div className="flex-1 p-3 space-y-2 overflow-y-auto">{dayEvents.length === 0 ? <p className="text-xs text-muted-foreground/50 text-center py-8">Livre</p> : dayEvents.map(e => <EventCard key={e.id} event={e} canEdit={canEdit} canDelete={canDelete} onEventClick={onEventClick} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />)}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && canViewDay && (
                <div className="min-h-[600px] p-6">
                    {getEventsForDate(currentDate).length === 0 ? (
                        <div className="text-center py-20"><Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" /><h3 className="font-bold text-muted-foreground">Dia Livre</h3>{canCreate && <Button className="mt-6 rounded-xl" onClick={onNewEvent}><Plus className="w-4 h-4 mr-2" />Agendar</Button>}</div>
                    ) : (
                        <div className="space-y-4">{getEventsForDate(currentDate).map(event => {
                            const cfg = getEventTypeConfig(event.type || 'presencial');
                            const Icon = cfg.icon;
                            return (
                                <div key={event.id} className="group rounded-2xl border p-5 hover:border-primary/30 hover:shadow-lg cursor-pointer" onClick={() => onEventClick(event)}>
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-3 rounded-xl", cfg.color)}><Icon className="w-6 h-6 text-white" /></div>
                                        <div className="flex-1"><h3 className="text-lg font-bold">{event.title}</h3><p className="text-sm text-muted-foreground mt-1"><Clock className="w-4 h-4 inline mr-1" />{event.start_time} - {event.end_time}</p>{event.description && <p className="text-sm text-muted-foreground mt-2">{event.description}</p>}</div>
                                        {(canEdit || canDelete) && (
                                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent>
                                                {canEdit && <DropdownMenuItem onClick={() => onEditEvent(event)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>}
                                                {canDelete && <DropdownMenuItem className="text-destructive" onClick={() => onDeleteEvent(event)}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>}
                                            </DropdownMenuContent></DropdownMenu>
                                        )}
                                    </div>
                                </div>
                            );
                        })}</div>
                    )}
                </div>
            )}
        </div>
    );
}
