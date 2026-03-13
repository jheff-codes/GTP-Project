import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgenda } from './hooks/useAgenda';
import { HeaderAgenda } from './components/HeaderAgenda';
import { CalendarioAgenda } from './components/CalendarioAgenda';
import { ListaAgenda } from './components/ListaAgenda';
import { ModalEvento } from './components/ModalEvento';

const Agenda = () => {
    const agenda = useAgenda();

    if (agenda.isLoading) return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-96 w-full" /></div>;
    if (agenda.error) return <div className="flex flex-col items-center justify-center h-96"><AlertCircle className="w-12 h-12 text-destructive" /><p>Erro ao carregar eventos</p></div>;

    if (!agenda.canViewAny) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">Você não tem permissão para acessar a agenda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" onMouseUp={agenda.handleDayMouseUp}>
            <HeaderAgenda
                typeFilter={agenda.typeFilter}
                setTypeFilter={agenda.setTypeFilter}
                canUseFilters={agenda.canUseFilters}
                canCreate={agenda.canCreate}
                onOpenFilters={() => agenda.setFiltersOpen(true)}
                onNewEvent={() => agenda.setNewEventOpen(true)}
                currentDate={agenda.currentDate}
                setCurrentDate={agenda.setCurrentDate}
                viewMode={agenda.viewMode}
                handleViewModeChange={agenda.handleViewModeChange}
                canViewMonth={agenda.canViewMonth}
                canViewWeek={agenda.canViewWeek}
                canViewDay={agenda.canViewDay}
                todaysCount={agenda.todaysEvents.length}
                totalCount={agenda.filteredEvents.length}
                upcomingCount={agenda.upcomingEvents.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <CalendarioAgenda
                    viewMode={agenda.viewMode}
                    canViewMonth={agenda.canViewMonth}
                    canViewWeek={agenda.canViewWeek}
                    canViewDay={agenda.canViewDay}
                    canCreate={agenda.canCreate}
                    canEdit={agenda.canEdit}
                    canDelete={agenda.canDelete}
                    daysInMonth={agenda.daysInMonth}
                    paddedDays={agenda.paddedDays}
                    weekDays={agenda.weekDays}
                    currentDate={agenda.currentDate}
                    selectedDates={agenda.selectedDates}
                    getEventsForDate={agenda.getEventsForDate}
                    onDayMouseDown={agenda.handleDayMouseDown}
                    onDayMouseEnter={agenda.handleDayMouseEnter}
                    onEventClick={(e) => { agenda.setSelectedEvent(e); agenda.setViewEventOpen(true); }}
                    onEditEvent={agenda.openEditModal}
                    onDeleteEvent={(e) => { agenda.setSelectedEvent(e); agenda.setDeleteConfirmOpen(true); }}
                    onNewEvent={() => agenda.setNewEventOpen(true)}
                />

                <ListaAgenda
                    todaysEvents={agenda.todaysEvents}
                    onEventClick={(e) => { agenda.setSelectedEvent(e); agenda.setViewEventOpen(true); }}
                />
            </div>

            <ModalEvento
                newEventOpen={agenda.newEventOpen}
                setNewEventOpen={agenda.setNewEventOpen}
                editEventOpen={agenda.editEventOpen}
                setEditEventOpen={agenda.setEditEventOpen}
                viewEventOpen={agenda.viewEventOpen}
                setViewEventOpen={agenda.setViewEventOpen}
                deleteConfirmOpen={agenda.deleteConfirmOpen}
                setDeleteConfirmOpen={agenda.setDeleteConfirmOpen}
                filtersOpen={agenda.filtersOpen}
                setFiltersOpen={agenda.setFiltersOpen}
                selectedEvent={agenda.selectedEvent}
                setSelectedEvent={agenda.setSelectedEvent}
                newEvent={agenda.newEvent}
                setNewEvent={agenda.setNewEvent}
                clients={agenda.clients}
                profiles={agenda.profiles}
                participantSearch={agenda.participantSearch}
                setParticipantSearch={agenda.setParticipantSearch}
                expandedRoles={agenda.expandedRoles}
                filteredParticipants={agenda.filteredParticipants}
                handleStartTimeChange={agenda.handleStartTimeChange}
                handleCreateEvent={agenda.handleCreateEvent}
                handleUpdateEvent={agenda.handleUpdateEvent}
                handleDeleteEvent={agenda.handleDeleteEvent}
                openEditModal={agenda.openEditModal}
                resetNewEvent={agenda.resetNewEvent}
                toggleParticipant={agenda.toggleParticipant}
                toggleRoleExpand={agenda.toggleRoleExpand}
                createEvent={agenda.createEvent}
                updateEvent={agenda.updateEvent}
                deleteEvent={agenda.deleteEvent}
            />
        </div>
    );
};

export default Agenda;
