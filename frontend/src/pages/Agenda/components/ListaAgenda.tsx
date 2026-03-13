import { Calendar, MapPin, Video, Phone, Users, Briefcase, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event } from '@/lib/database.types';

const EVENT_TYPES_LOCAL = [
    { key: 'presencial', icon: MapPin, color: 'bg-emerald-500' },
    { key: 'video', icon: Video, color: 'bg-blue-500' },
    { key: 'ligacao', icon: Phone, color: 'bg-yellow-500' },
    { key: 'reuniao_interna', icon: Users, color: 'bg-purple-500' },
    { key: 'evento_corporativo', icon: Briefcase, color: 'bg-orange-500' },
    { key: 'compromisso_pessoal', icon: Heart, color: 'bg-pink-500' },
];

const getEventTypeConfig = (type: string) => EVENT_TYPES_LOCAL.find(t => t.key === type) || EVENT_TYPES_LOCAL[0];

interface ListaAgendaProps {
    todaysEvents: Event[];
    onEventClick: (event: Event) => void;
}

export function ListaAgenda({ todaysEvents, onEventClick }: ListaAgendaProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="rounded-[2rem] border bg-card/50 p-5 shadow-lg flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">Hoje</h3>
                        <p className="text-xs text-muted-foreground">{todaysEvents.length} eventos</p>
                    </div>
                </div>
                {todaysEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground/70 text-center py-6">Nenhum evento</p>
                ) : (
                    <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scroll">
                        {todaysEvents.map(e => {
                            const cfg = getEventTypeConfig(e.type || 'presencial');
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={e.id}
                                    className="p-3 rounded-xl border cursor-pointer hover:border-primary/30 transition-colors"
                                    onClick={() => onEventClick(e)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", cfg.color)}>
                                            <Icon className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{e.title}</p>
                                            <p className="text-xs text-muted-foreground">{e.start_time}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
