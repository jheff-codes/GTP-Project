import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, Profile } from '@/lib/database.types';
import { getSubordinateIds } from './useClients';

/**
 * Filter events based on the strict hierarchy and privacy rules:
 * - Admin/Imob: Sees everything.
 * - Others: Sees events they own, events owned by subordinates, or where they are participants.
 */
export function filterEventsByHierarchy(
    events: Event[] | undefined | null,
    currentUser: Profile | undefined | null,
    profiles: Profile[] | undefined | null
): Event[] {
    if (!currentUser || !profiles || !events) return [];

    const subordinateIds = getSubordinateIds(currentUser.id, currentUser.role || 'broker', profiles);
    const role = (currentUser.role || 'broker').toLowerCase();
    const isImobiliaria = role === 'admin' || role === 'imobiliaria' || role === 'imob';

    return events.filter(event => {
        if (isImobiliaria) return true;

        const isOwnerAllowed = event.owner_id ? subordinateIds.includes(event.owner_id) : false;
        const isCreatorAllowed = subordinateIds.includes(event.user_id);
        const isParticipant = event.participants?.includes(currentUser.id);

        return isOwnerAllowed || isCreatorAllowed || isParticipant;
    });
}

// Fetch all events
export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return data as Event[];
        },
    });
}

// Fetch events for a specific date range
export function useEventsByDateRange(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['events', 'range', startDate, endDate],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;
            return data as Event[];
        },
        enabled: !!startDate && !!endDate,
    });
}

// Create a new event
export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEvent: Partial<Event>) => {
            const { data, error } = await supabase
                .from('events')
                .insert(newEvent)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

// Update an event
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: Partial<Event> }) => {
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

// Delete an event
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}
