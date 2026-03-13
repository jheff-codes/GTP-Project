import { MessageSquare, Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ALLOWED_CONVERSATION_STATUS } from '../constantes';
import type { Client } from '@/lib/database.types';

interface UltimasConversasProps {
    filteredClients: Client[];
    recentMessages: any[] | undefined;
    profiles: any[] | undefined;
    isLoading: boolean;
    onClientClick: (client: Client) => void;
}

const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
};

export const UltimasConversas = ({
    filteredClients,
    recentMessages,
    profiles,
    isLoading,
    onClientClick,
}: UltimasConversasProps) => {
    return (
        <div className="gtp-card h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <span className="micro-label flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    Últimas Conversas
                </span>
                <span className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Ao Vivo
                </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scroll pr-2 flex-1 min-h-0">
                {isLoading ? (
                    [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
                ) : (
                    (() => {
                        const activeClients = filteredClients?.filter(client =>
                            client.status &&
                            ALLOWED_CONVERSATION_STATUS.includes(client.status.toLowerCase()) &&
                            (client.last_interaction || client.created_at)
                        ) || [];

                        const sortedClients = activeClients.sort((a, b) => {
                            const dateA = new Date(a.last_interaction || a.created_at).getTime();
                            const dateB = new Date(b.last_interaction || b.created_at).getTime();
                            return dateB - dateA;
                        });

                        if (sortedClients.length === 0) {
                            return (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhum cliente em atendimento
                                </p>
                            );
                        }

                        return sortedClients.map(client => {
                            const lastMessage = recentMessages?.find(m => m.client_id === client.id);
                            const owner = profiles?.find(p => p.id === client.owner_id);
                            const lastInteractionDate = client.last_interaction || client.created_at;

                            return (
                                <button
                                    key={client.id}
                                    onClick={() => onClientClick(client)}
                                    className="w-full p-4 bg-slate-900/50 rounded-2xl text-left hover:bg-slate-800/50 transition-colors border border-slate-800"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-emerald-500 text-sm">
                                                    {getInitials(client.name)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{client.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                    RESP: {owner?.name || 'SEM DONO'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {formatRelativeTime(lastInteractionDate)}
                                        </span>
                                    </div>
                                    <div className="ml-13 pl-13">
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Bot className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                            <span className="truncate">
                                                {lastMessage
                                                    ? (lastMessage.bot_message || lastMessage.user_message || 'Imagem/Áudio')
                                                    : 'Ver histórico de conversas...'}
                                            </span>
                                        </p>
                                    </div>
                                </button>
                            );
                        });
                    })()
                )}
            </div>
        </div>
    );
};
