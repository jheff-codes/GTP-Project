import { useState, useMemo, useEffect } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, filterEventsByHierarchy } from '@/hooks/useEvents';
import { useClients, getSubordinateIds } from '@/hooks/useClients';
import { useProfiles } from '@/hooks/useProfiles';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Profile, Event } from '@/lib/database.types';

export const EVENT_TYPES = [
    { key: 'presencial', label: 'Visita Presencial', icon: 'MapPin', color: 'bg-emerald-500' },
    { key: 'video', label: 'Vídeo Chamada', icon: 'Video', color: 'bg-blue-500' },
    { key: 'ligacao', label: 'Ligação Telefônica', icon: 'Phone', color: 'bg-yellow-500' },
    { key: 'reuniao_interna', label: 'Reunião Interna', icon: 'Users', color: 'bg-purple-500' },
    { key: 'evento_corporativo', label: 'Evento Corporativo', icon: 'Briefcase', color: 'bg-orange-500' },
    { key: 'compromisso_pessoal', label: 'Compromisso Pessoal', icon: 'Heart', color: 'bg-pink-500' },
] as const;

export const ROLE_HIERARCHY: Record<string, string[]> = {
    admin: ['imobiliaria', 'director', 'manager', 'coordinator', 'broker'],
    imobiliaria: ['director', 'manager', 'coordinator', 'broker'],
    director: ['manager', 'coordinator', 'broker'],
    manager: ['coordinator', 'broker'],
    coordinator: ['broker'],
    broker: [],
};

export const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { admin: 'Administrador', imobiliaria: 'Imobiliária', director: 'Diretor', manager: 'Gerente', coordinator: 'Coordenador', broker: 'Corretor' };
    return labels[role] || role;
};

export function useAgenda() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Date | null>(null);
    const [newEventOpen, setNewEventOpen] = useState(false);
    const [editEventOpen, setEditEventOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [viewEventOpen, setViewEventOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [participantSearch, setParticipantSearch] = useState('');
    const [expandedRoles, setExpandedRoles] = useState<string[]>(['imobiliaria']);

    const [newEvent, setNewEvent] = useState({
        title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00', end_time: '10:00', type: 'presencial', client_id: '', participants: [] as string[],
    });

    const { data: events, isLoading, error } = useEvents();
    const { data: clients } = useClients();
    const { data: profiles } = useProfiles();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const { data: currentUser } = useCurrentUser();

    // Permission helpers
    const hasPermission = (section: string, action: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        const sectionPerms = currentUser.parsedPermissions[section as keyof typeof currentUser.parsedPermissions];
        if (!sectionPerms) return false;
        return (sectionPerms as Record<string, boolean>)[action] === true;
    };

    const canViewMonth = hasPermission('calendar', 'view_month');
    const canViewWeek = hasPermission('calendar', 'view_week');
    const canViewDay = hasPermission('calendar', 'view_day');
    const canCreate = hasPermission('calendar', 'create');
    const canEdit = hasPermission('calendar', 'edit');
    const canDelete = hasPermission('calendar', 'delete');
    const canUseFilters = hasPermission('calendar', 'use_filters');
    const canViewAny = canViewMonth || canViewWeek || canViewDay;

    useEffect(() => {
        if (currentUser) {
            if (viewMode === 'month' && !canViewMonth) {
                if (canViewWeek) setViewMode('week');
                else if (canViewDay) setViewMode('day');
            }
        }
    }, [currentUser, canViewMonth, canViewWeek, canViewDay, viewMode]);

    const currentUserProfile = profiles?.[0];
    const allowedRoles = useMemo(() => currentUserProfile?.role ? (ROLE_HIERARCHY[currentUserProfile.role as string] || []) : [], [currentUserProfile]);

    const selectableProfiles = useMemo(() =>
        profiles?.filter(p => allowedRoles.includes(p.role as string) && p.id !== currentUserProfile?.id) || [],
        [profiles, allowedRoles, currentUserProfile]
    );

    const profilesByRole = useMemo(() => {
        const groups: Record<string, Profile[]> = {};
        selectableProfiles.forEach(p => { const r = p.role as string || 'other'; if (!groups[r]) groups[r] = []; groups[r].push(p); });
        return groups;
    }, [selectableProfiles]);

    const filteredEvents = useMemo(() => {
        const safe = filterEventsByHierarchy(events, currentUser, profiles);
        if (typeFilter === 'all') return safe;
        return safe.filter(e => e.type === typeFilter);
    }, [events, currentUser, profiles, typeFilter]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const paddedDays = Array(monthStart.getDay()).fill(null);

    const weekDays = useMemo(() => {
        if (selectedDates.length > 0) {
            const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
            return sorted;
        }
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [selectedDates, currentDate]);

    // Drag selection handlers
    const handleDayMouseDown = (day: Date) => {
        setIsDragging(true);
        setDragStart(day);
        setSelectedDates([day]);
    };

    const handleDayMouseEnter = (day: Date) => {
        if (!isDragging || !dragStart) return;
        const start = dragStart < day ? dragStart : day;
        const end = dragStart < day ? day : dragStart;
        const range = eachDayOfInterval({ start, end });
        setSelectedDates(range.slice(0, 7));
    };

    const handleDayMouseUp = () => {
        if (isDragging && selectedDates.length > 0) {
            if (selectedDates.length === 1) {
                if (canViewDay) { setViewMode('day'); setCurrentDate(selectedDates[0]); }
            } else {
                if (canViewWeek) { setViewMode('week'); setCurrentDate(selectedDates[0]); }
            }
        }
        setIsDragging(false);
        setDragStart(null);
    };

    const handleViewModeChange = (mode: 'month' | 'week' | 'day') => {
        setSelectedDates([]);
        setViewMode(mode);
    };

    const getEventsForDate = (date: Date) => filteredEvents.filter(e => e.date && isSameDay(parseISO(e.date), date));
    const getClient = (id: number | null) => clients?.find(c => c.id === id);

    const todaysEvents = getEventsForDate(new Date());
    const upcomingEvents = filteredEvents.filter(e => e.date && parseISO(e.date) >= new Date()).slice(0, 5);

    const handleStartTimeChange = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        setNewEvent({ ...newEvent, start_time: time, end_time: `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
    };

    const resetNewEvent = () => {
        setNewEvent({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00', end_time: '10:00', type: 'presencial', client_id: '', participants: [] });
        setParticipantSearch('');
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date) { toast.error('Preencha título e data'); return; }
        try {
            await createEvent.mutateAsync({
                title: newEvent.title, description: newEvent.description, date: newEvent.date,
                start_time: newEvent.start_time, end_time: newEvent.end_time, type: newEvent.type,
                client_id: newEvent.client_id ? parseInt(newEvent.client_id) : null,
                participants: newEvent.participants,
                agency_id: currentUser?.agency_id,
                owner_id: currentUser?.id,
            });
            toast.success('Evento criado!'); setNewEventOpen(false); resetNewEvent();
        } catch { toast.error('Erro ao criar evento'); }
    };

    const handleUpdateEvent = async () => {
        if (!selectedEvent) return;
        try {
            await updateEvent.mutateAsync({
                id: selectedEvent.id,
                updates: {
                    title: newEvent.title, description: newEvent.description, date: newEvent.date,
                    start_time: newEvent.start_time, end_time: newEvent.end_time, type: newEvent.type,
                    client_id: newEvent.client_id ? parseInt(newEvent.client_id) : null,
                    participants: newEvent.participants,
                },
            });
            toast.success('Evento atualizado!'); setEditEventOpen(false); resetNewEvent();
        } catch { toast.error('Erro ao atualizar'); }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        try { await deleteEvent.mutateAsync(selectedEvent.id); toast.success('Excluído!'); setDeleteConfirmOpen(false); setSelectedEvent(null); }
        catch { toast.error('Erro ao excluir'); }
    };

    const openEditModal = (event: Event) => {
        setSelectedEvent(event);
        setNewEvent({ title: event.title || '', description: event.description || '', date: event.date || format(new Date(), 'yyyy-MM-dd'), start_time: event.start_time || '09:00', end_time: event.end_time || '10:00', type: event.type || 'presencial', client_id: event.client_id?.toString() || '', participants: event.participants || [] });
        setEditEventOpen(true);
    };

    const toggleParticipant = (id: string) => setNewEvent(p => ({ ...p, participants: p.participants.includes(id) ? p.participants.filter(x => x !== id) : [...p.participants, id] }));
    const toggleRoleExpand = (role: string) => setExpandedRoles(p => p.includes(role) ? p.filter(r => r !== role) : [...p, role]);

    const filteredParticipants = useMemo(() => {
        if (!participantSearch) return profilesByRole;
        const s = participantSearch.toLowerCase();
        const f: Record<string, Profile[]> = {};
        Object.entries(profilesByRole).forEach(([r, ps]) => { const m = ps.filter(p => p.name?.toLowerCase().includes(s)); if (m.length) f[r] = m; });
        return f;
    }, [profilesByRole, participantSearch]);

    return {
        // Data
        events, clients, profiles, currentUser, filteredEvents, todaysEvents, upcomingEvents,
        daysInMonth, paddedDays, weekDays,
        isLoading, error,
        // State
        currentDate, setCurrentDate, viewMode, selectedDates,
        newEventOpen, setNewEventOpen, editEventOpen, setEditEventOpen,
        deleteConfirmOpen, setDeleteConfirmOpen, viewEventOpen, setViewEventOpen,
        filtersOpen, setFiltersOpen, selectedEvent, setSelectedEvent,
        typeFilter, setTypeFilter, newEvent, setNewEvent,
        participantSearch, setParticipantSearch, expandedRoles,
        // Permissions
        canViewMonth, canViewWeek, canViewDay, canCreate, canEdit, canDelete, canUseFilters, canViewAny,
        // Handlers
        handleDayMouseDown, handleDayMouseEnter, handleDayMouseUp,
        handleViewModeChange, getEventsForDate, getClient, handleStartTimeChange,
        handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
        openEditModal, resetNewEvent, toggleParticipant, toggleRoleExpand, filteredParticipants,
        createEvent, updateEvent, deleteEvent,
    };
}
