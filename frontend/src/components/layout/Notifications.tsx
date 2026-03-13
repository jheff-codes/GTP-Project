import { useState, useEffect } from 'react';
import { Bell, UserPlus, AlertTriangle, Check, X, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NOTIFICATION_ICONS: Record<string, any> = {
    lead_assigned: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    system: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    default: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' }
};

export function Notifications({ userId }: { userId?: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!userId) return;

        // 1. Database Notifications
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        let systemNotifications: Notification[] = [];

        // 2. Smart Alerts (Ex: Leads sem dono - apenas para gestores?)
        // Simplificado: por enquanto mantém a lógica anterior ou refina
        try {
            const { count } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .is('owner_id', null);

            if (count && count > 0) {
                systemNotifications.push({
                    id: 999999, // Hack para ID de sistema (número alto)
                    user_id: userId,
                    title: 'Leads em Espera',
                    message: `Existem ${count} leads aguardando distribuição.`,
                    read: false,
                    created_at: new Date().toISOString(),
                    link_path: '/leads?view=redistribute',
                    type: 'system'
                } as any);
            }
        } catch (e) { console.error(e); }

        if (data) {
            const dbNotifications = data as Notification[];
            const allNotes = [...systemNotifications, ...dbNotifications];
            setNotifications(allNotes);
            setUnreadCount(allNotes.filter(n => !n.read).length);
        }
    };

    // Real-time subscription
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    fetchNotifications();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, userId]);

    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    const handleRead = async (id: number, link?: string | null) => {
        if (typeof id === 'number' && id !== 999999) {
            await supabase.from('notifications').update({ read: true }).eq('id', id);
        }

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (link) {
            setOpen(false);
            navigate(link);
        }
    };

    const markAllRead = async () => {
        if (!userId) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-2xl relative hover:bg-muted transition-all duration-300"
                >
                    <Bell className="w-5 h-5 text-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 bg-sidebar border-sidebar-border shadow-2xl rounded-3xl overflow-hidden" align="end">
                <div className="flex items-center justify-between p-5 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-md">
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-widest">Notificações</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                            {unreadCount} não lidas
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            className="text-[10px] font-black uppercase tracking-widest h-auto py-2 px-3 hover:bg-primary/10 hover:text-primary rounded-xl"
                        >
                            <Check className="w-3 h-3 mr-1" />
                            Ler todas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <Bell className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-sidebar-border">
                            {notifications.map((n) => {
                                const config = NOTIFICATION_ICONS[n.type || 'default'] || NOTIFICATION_ICONS.default;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "p-5 hover:bg-sidebar-accent/50 transition-all duration-300 cursor-pointer group relative",
                                            !n.read && "bg-primary/5"
                                        )}
                                        onClick={() => handleRead(n.id, n.link_path || null)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5", config.bg)}>
                                                <Icon className={cn("w-5 h-5", config.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h5 className={cn("text-sm font-bold truncate leading-tight", !n.read ? "text-foreground" : "text-muted-foreground")}>
                                                        {n.title}
                                                    </h5>
                                                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR }) : ''}
                                                </div>
                                            </div>
                                        </div>

                                        {n.link_path && (
                                            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-3 h-3 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 border-t border-sidebar-border bg-sidebar/30 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                        Ver histórico completo
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
