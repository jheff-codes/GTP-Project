import { Calendar, Clock, Loader2, Check, Trash2, Edit, AlertCircle, X, ChevronRight, MapPin, Video, Phone, Users as UsersIcon, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Event, Profile, Client } from '@/lib/database.types';
import { getRoleLabel } from '../hooks/useAgenda';

const EVENT_TYPES = [
    { key: 'presencial', label: 'Visita Presencial', icon: MapPin, color: 'bg-emerald-500' },
    { key: 'video', label: 'Vídeo Chamada', icon: Video, color: 'bg-blue-500' },
    { key: 'ligacao', label: 'Ligação Telefônica', icon: Phone, color: 'bg-yellow-500' },
    { key: 'reuniao_interna', label: 'Reunião Interna', icon: UsersIcon, color: 'bg-purple-500' },
    { key: 'evento_corporativo', label: 'Evento Corporativo', icon: Briefcase, color: 'bg-orange-500' },
    { key: 'compromisso_pessoal', label: 'Compromisso Pessoal', icon: Heart, color: 'bg-pink-500' },
];

interface ModalEventoProps {
    // New event modal
    newEventOpen: boolean;
    setNewEventOpen: (v: boolean) => void;
    // Edit event modal
    editEventOpen: boolean;
    setEditEventOpen: (v: boolean) => void;
    // View event modal
    viewEventOpen: boolean;
    setViewEventOpen: (v: boolean) => void;
    // Delete confirm modal
    deleteConfirmOpen: boolean;
    setDeleteConfirmOpen: (v: boolean) => void;
    // Filters modal
    filtersOpen: boolean;
    setFiltersOpen: (v: boolean) => void;
    // Data
    selectedEvent: Event | null;
    setSelectedEvent: (e: Event | null) => void;
    newEvent: { title: string; description: string; date: string; start_time: string; end_time: string; type: string; client_id: string; participants: string[] };
    setNewEvent: React.Dispatch<React.SetStateAction<ModalEventoProps['newEvent']>>;
    clients: Client[] | undefined;
    profiles: Profile[] | undefined;
    participantSearch: string;
    setParticipantSearch: (v: string) => void;
    expandedRoles: string[];
    filteredParticipants: Record<string, Profile[]>;
    // Handlers
    handleStartTimeChange: (time: string) => void;
    handleCreateEvent: () => void;
    handleUpdateEvent: () => void;
    handleDeleteEvent: () => void;
    openEditModal: (event: Event) => void;
    resetNewEvent: () => void;
    toggleParticipant: (id: string) => void;
    toggleRoleExpand: (role: string) => void;
    createEvent: { isPending: boolean };
    updateEvent: { isPending: boolean };
    deleteEvent: { isPending: boolean };
}

export function ModalEvento(props: ModalEventoProps) {
    const {
        newEventOpen, setNewEventOpen, editEventOpen, setEditEventOpen,
        viewEventOpen, setViewEventOpen, deleteConfirmOpen, setDeleteConfirmOpen,
        filtersOpen, setFiltersOpen,
        selectedEvent, setSelectedEvent, newEvent, setNewEvent,
        clients, profiles, participantSearch, setParticipantSearch,
        expandedRoles, filteredParticipants,
        handleStartTimeChange, handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
        openEditModal, resetNewEvent, toggleParticipant, toggleRoleExpand,
        createEvent, updateEvent, deleteEvent,
    } = props;

    const renderEventForm = (isEdit: boolean) => (
        <div className="space-y-6 mt-4">
            <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Título</Label><Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Ex: Visita ao Imóvel X" className="mt-2 bg-slate-800 border-slate-700" /></div>
            <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição</Label><Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Detalhes..." className="mt-2 bg-slate-800 border-slate-700 min-h-[80px]" /></div>
            {!isEdit && (
                <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo</Label><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">{EVENT_TYPES.map(t => { const Icon = t.icon; return <button key={t.key} onClick={() => setNewEvent({ ...newEvent, type: t.key })} className={cn("flex items-center gap-2 p-3 rounded-xl border text-sm", newEvent.type === t.key ? "border-primary bg-primary/10 text-primary" : "border-slate-700")}><Icon className="w-4 h-4" />{t.label}</button>; })}</div></div>
            )}
            <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Data</Label><Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="mt-2 bg-slate-800 border-slate-700" /></div>
                <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Início</Label><Input type="time" value={newEvent.start_time} onChange={e => isEdit ? setNewEvent({ ...newEvent, start_time: e.target.value }) : handleStartTimeChange(e.target.value)} className="mt-2 bg-slate-800 border-slate-700" /></div>
                <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Fim</Label><Input type="time" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} className="mt-2 bg-slate-800 border-slate-700" /></div>
            </div>
            {!isEdit && (
                <>
                    <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Cliente</Label><Select value={newEvent.client_id || "none"} onValueChange={v => setNewEvent({ ...newEvent, client_id: v === "none" ? '' : v })}><SelectTrigger className="mt-2 bg-slate-800 border-slate-700"><SelectValue placeholder="Sem cliente" /></SelectTrigger><SelectContent><SelectItem value="none">Sem cliente</SelectItem>{clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name || c.phone}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Participantes ({newEvent.participants.length})</Label><Input placeholder="Buscar..." value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} className="mt-2 bg-slate-800 border-slate-700" />
                        {newEvent.participants.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{newEvent.participants.map(id => { const p = profiles?.find(x => x.id === id); return p ? <span key={id} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1">{p.name}<button onClick={() => toggleParticipant(id)}><X className="w-3 h-3" /></button></span> : null; })}</div>}
                        <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">{Object.entries(filteredParticipants).map(([role, profs]) => <div key={role} className="border border-slate-700 rounded-lg overflow-hidden"><button onClick={() => toggleRoleExpand(role)} className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700"><span className="text-sm font-medium uppercase">{getRoleLabel(role)}s</span><ChevronRight className={cn("w-4 h-4", expandedRoles.includes(role) && "rotate-90")} /></button>{expandedRoles.includes(role) && <div className="divide-y divide-slate-700">{profs.map(p => <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-800 cursor-pointer"><Checkbox checked={newEvent.participants.includes(p.id)} onCheckedChange={() => toggleParticipant(p.id)} /><span className="text-sm">{p.name}</span></label>)}</div>}</div>)}</div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <>
            {/* NEW EVENT */}
            <Dialog open={newEventOpen} onOpenChange={o => { setNewEventOpen(o); if (!o) resetNewEvent(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />NOVO COMPROMISSO</DialogTitle><DialogDescription>Preencha os dados do agendamento</DialogDescription></DialogHeader>
                    {renderEventForm(false)}
                    <DialogFooter className="mt-6 gap-2"><Button variant="outline" onClick={() => setNewEventOpen(false)}>Cancelar</Button><Button onClick={handleCreateEvent} disabled={createEvent.isPending} className="bg-primary">{createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Salvar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT EVENT */}
            <Dialog open={editEventOpen} onOpenChange={o => { setEditEventOpen(o); if (!o) resetNewEvent(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader><DialogTitle>Editar Evento</DialogTitle><DialogDescription>Atualize os dados</DialogDescription></DialogHeader>
                    {renderEventForm(true)}
                    <DialogFooter className="mt-6 gap-2"><Button variant="outline" onClick={() => setEditEventOpen(false)}>Cancelar</Button><Button onClick={handleUpdateEvent} disabled={updateEvent.isPending} className="bg-primary">{updateEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Salvar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* VIEW EVENT */}
            <Dialog open={viewEventOpen} onOpenChange={o => { setViewEventOpen(o); if (!o) setSelectedEvent(null); }}>
                <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
                    <DialogHeader><DialogTitle>{selectedEvent?.title}</DialogTitle><DialogDescription>Detalhes do compromisso</DialogDescription></DialogHeader>
                    {selectedEvent && <div className="space-y-4 mt-4"><p><Calendar className="w-4 h-4 inline mr-2" />{selectedEvent.date && format(parseISO(selectedEvent.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p><p><Clock className="w-4 h-4 inline mr-2" />{selectedEvent.start_time} - {selectedEvent.end_time}</p>{selectedEvent.description && <p className="p-3 bg-slate-800 rounded-lg">{selectedEvent.description}</p>}</div>}
                    <DialogFooter className="mt-6 gap-2"><Button variant="outline" onClick={() => setViewEventOpen(false)}>Fechar</Button><Button variant="outline" onClick={() => { setViewEventOpen(false); if (selectedEvent) openEditModal(selectedEvent); }}><Edit className="w-4 h-4 mr-2" />Editar</Button><Button variant="destructive" onClick={() => { setViewEventOpen(false); setDeleteConfirmOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="max-w-sm bg-slate-900 border-slate-700">
                    <DialogHeader><DialogTitle className="text-destructive flex items-center gap-2"><AlertCircle className="w-5 h-5" />Excluir Evento</DialogTitle><DialogDescription>Deseja excluir "{selectedEvent?.title}"?</DialogDescription></DialogHeader>
                    <DialogFooter className="mt-4 gap-2"><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={handleDeleteEvent} disabled={deleteEvent.isPending}>{deleteEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Excluir</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* FILTERS */}
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-700">
                    <DialogHeader><DialogTitle>Filtros</DialogTitle><DialogDescription>Filtre os eventos</DialogDescription></DialogHeader>
                    <div className="space-y-4 mt-4"><p className="text-sm text-muted-foreground">Filtros adicionais em breve...</p></div>
                    <DialogFooter><Button onClick={() => setFiltersOpen(false)}>Fechar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
