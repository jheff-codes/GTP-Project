import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/database.types';

// Fetch all chat messages
export function useChatMessages() {
    return useQuery({
        queryKey: ['chat_messages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ChatMessage[];
        },
    });
}

// Fetch chat messages for a specific client
export function useClientChatMessages(clientId: number | null) {
    return useQuery({
        queryKey: ['chat_messages', 'client', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as ChatMessage[];
        },
        enabled: !!clientId,
    });
}

// Fetch recent chat messages (last 24 hours)
export function useRecentChatMessages(limit: number = 20) {
    return useQuery({
        queryKey: ['chat_messages', 'recent', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as ChatMessage[];
        },
    });
}
