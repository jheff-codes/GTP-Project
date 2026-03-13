import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Send, Bot, User, Image, FileText, Loader2, ChevronDown, Check, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientChatMessages } from '@/hooks/useChatMessages';
import { useProfiles } from '@/hooks/useProfiles';
import { useUpdateClient } from '@/hooks/useClients';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Types inferred from Supabase runtime - no explicit import needed

interface ChatModalProps {
    client: any | null;
    open: boolean;
    onClose: () => void;
}

export function ChatModal({ client, open, onClose }: ChatModalProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading } = useClientChatMessages(client?.id || null);
    const { data: profiles } = useProfiles();
    const { data: currentUser } = useCurrentUser();
    const updateClient = useUpdateClient();
    const queryClient = useQueryClient();

    // Permissions
    const canPauseAI = currentUser?.role === 'admin' || currentUser?.parsedPermissions?.clients?.pause_ai === true;
    const canReassign = currentUser?.role === 'admin' || currentUser?.parsedPermissions?.clients?.reassign === true;
    const canSendMessage = currentUser?.role === 'admin' || currentUser?.parsedPermissions?.clients?.send_message === true;

    // Get current owner
    const currentOwner = profiles?.find(p => p.id === client?.owner_id);

    // Helper to filter subordinates (duplicated from Leads.tsx for now)
    const getSubordinates = (user: any, allProfiles: any[]) => {
        if (!user || user.role === 'admin' || user.role === 'imobiliaria' || (user.role as string) === 'imob') {
            return allProfiles.filter(p => ['broker', 'corretor', 'manager', 'coordinator', 'director'].includes(p.role));
        }
        const findSubs = (parentId: string): string[] => {
            const direct = allProfiles.filter(p =>
                p.director_id === parentId ||
                p.manager_id === parentId ||
                p.coordinator_id === parentId
            ).map(p => p.id);
            let all = [...direct];
            direct.forEach(subId => {
                all = [...all, ...findSubs(subId)];
            });
            return all;
        };
        const subIds = findSubs(user.id);
        return allProfiles.filter(p => subIds.includes(p.id));
    };

    // Sorted potential owners (Queue Logic)
    const availableOwners = profiles ? getSubordinates(currentUser, profiles)
        .filter(p => p.role === 'broker' || (p.role as string) === 'corretor' || p.role === 'manager' || p.role === 'coordinator' || p.role === 'director') // Allow reassign to any subordinate, but usually brokers
        .sort((a, b) => {
            const aActive = a.active === 'ativado';
            const bActive = b.active === 'ativado';
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            const timeA = a.checkin || '99:99:99';
            const timeB = b.checkin || '99:99:99';
            return timeA.localeCompare(timeB);
        }) : [];

    // AI status (using ia_service column from database)
    const isAIActive = client?.ia_service === 'active';

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (!open || !client) return null;

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Group messages by date
    const groupedMessages: { [date: string]: any[] } = {};
    messages?.forEach((msg) => {
        const date = formatDate(msg.created_at);
        if (!groupedMessages[date]) {
            groupedMessages[date] = [];
        }
        groupedMessages[date].push(msg);
    });

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleChangeOwner = async (newOwnerId: string) => {
        if (!client) return;
        try {
            await updateClient.mutateAsync({
                id: client.id,
                updates: { owner_id: newOwnerId },
            });
            toast.success('Responsável atualizado!');
        } catch (error) {
            console.error('Erro ao atualizar responsável:', error);
            toast.error('Erro ao atualizar responsável');
        }
    };



    const handleSendMessage = async () => {
        if (!message.trim() || !client || !currentUser) return;

        const sentMessage = message;
        setSending(true);
        setMessage('');

        // Optimistic UI: add the message to the chat instantly
        const optimisticMsg = {
            id: Date.now(),
            client_id: client.id,
            user_message: null,
            bot_message: sentMessage,
            created_at: new Date().toISOString(),
            media_url: null,
            media_type: null,
            media_name: null,
        };

        const queryKey = ['chat_messages', 'client', client.id];
        queryClient.setQueryData(queryKey, (old: any[] | undefined) => [
            ...(old || []),
            optimisticMsg,
        ]);

        try {
            const payload = {
                ...client,
                mensagem: sentMessage,
                nome_corretor: currentUser?.name,
                id_corretor: currentUser?.id,
            };

            await fetch('https://nwn.iagtp.com.br/webhook/enviar-mensagem-sistema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            toast.success('Mensagem enviada!');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            toast.error('Erro ao enviar mensagem');
            // Rollback: remove the optimistic message on error
            queryClient.setQueryData(queryKey, (old: any[] | undefined) =>
                (old || []).filter((m: any) => m.id !== optimisticMsg.id)
            );
        } finally {
            setSending(false);
        }
    };

    const handleToggleAI = async () => {
        if (!client) return;
        const newStatus = isAIActive ? 'paused' : 'active';
        try {
            await updateClient.mutateAsync({
                id: client.id,
                updates: { ia_service: newStatus },
            });
            toast.success(newStatus === 'active' ? 'IA ativada!' : 'IA pausada!');
        } catch (error) {
            console.error('Erro ao alterar status da IA:', error);
            toast.error('Erro ao alterar status da IA');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg h-[85vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-primary">{getInitials(client.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0 relative group">
                            <h3 className="font-bold text-lg cursor-default">{client.name || 'Cliente'}</h3>
                            <p className="text-sm text-muted-foreground">{client.phone}</p>

                            {/* HoverCard - Client Details */}
                            <div className="absolute top-full left-0 mt-2 z-50 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto">
                                <div className="bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 border-b border-border pb-2">
                                        <Bot className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resumo do Lead</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Instância SDR</span>
                                            <span className="text-foreground font-medium">{client.instance_name || 'Desconhecida'}</span>
                                        </div>
                                        {client.renda && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Renda</span>
                                                <span className="text-foreground font-medium">{client.renda}</span>
                                            </div>
                                        )}
                                        {client.quartos && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Quartos</span>
                                                <span className="text-foreground font-medium">{client.quartos}</span>
                                            </div>
                                        )}
                                        {client.bairro && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Bairro</span>
                                                <span className="text-foreground font-medium">{client.bairro}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="col-span-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">E-mail</span>
                                                <span className="text-foreground font-medium truncate block">{client.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* AI Toggle */}
                        {canPauseAI && (
                            <Button
                                variant={isAIActive ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'gap-2',
                                    isAIActive ? 'bg-primary hover:bg-primary/90' : 'border-destructive text-destructive'
                                )}
                                onClick={handleToggleAI}
                                disabled={updateClient.isPending}
                            >
                                <Power className="w-4 h-4" />
                                <span className="hidden sm:inline">{isAIActive ? 'IA Ligada' : 'IA Pausada'}</span>
                            </Button>
                        )}

                        {/* Owner Selector */}
                        {canReassign ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="max-w-24 truncate hidden sm:inline">
                                            {currentOwner?.name || 'Sem responsável'}
                                        </span>
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto custom-scroll">
                                    {availableOwners.map((profile) => (
                                        <DropdownMenuItem
                                            key={profile.id}
                                            onClick={() => handleChangeOwner(profile.id)}
                                            className="gap-2"
                                        >
                                            {profile.id === client.owner_id && (
                                                <Check className="w-4 h-4 text-primary" />
                                            )}
                                            <span className={profile.id !== client.owner_id ? 'ml-6' : ''}>
                                                {profile.name}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="ghost" size="sm" className="gap-2 cursor-default" disabled>
                                <User className="w-4 h-4" />
                                <span className="max-w-24 truncate hidden sm:inline">
                                    {currentOwner?.name || 'Sem responsável'}
                                </span>
                            </Button>
                        )}

                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : messages?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Bot className="w-12 h-12 mb-2" />
                            <p>Nenhuma mensagem encontrada</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, dateMessages]) => (
                            <div key={date}>
                                {/* Date separator */}
                                <div className="flex items-center gap-2 my-4">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground px-2">{date}</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                {/* Messages for this date */}
                                {dateMessages.map((msg) => (
                                    <div key={msg.id} className="space-y-2 mb-3">
                                        {/* User/Client message - LEFT side */}
                                        {msg.user_message && (
                                            <div className="flex justify-start">
                                                <div className="max-w-[80%] bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                                                    {msg.media_url && (
                                                        <div className="mb-2">
                                                            {msg.media_type?.includes('image') ? (
                                                                <img src={msg.media_url} alt="" className="rounded-lg max-w-full" />
                                                            ) : (
                                                                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                                                                    <FileText className="w-4 h-4" />
                                                                    <span className="text-xs">{msg.media_name || 'Arquivo'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.user_message}</p>
                                                    <span className="text-[10px] text-muted-foreground mt-1 block">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bot/IA message - RIGHT side */}
                                        {msg.bot_message && (
                                            <div className="flex justify-end">
                                                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Bot className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">IA</span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.bot_message}</p>
                                                    <span className="text-[10px] opacity-70 mt-1 block text-right">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 rounded-full"
                            disabled={sending}
                        />
                        <Button
                            size="icon"
                            className="rounded-full"
                            onClick={handleSendMessage}
                            disabled={!message.trim() || sending || !canSendMessage}
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
