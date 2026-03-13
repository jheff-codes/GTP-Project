import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';
import { Search, Sun, Moon } from 'lucide-react';
import { Notifications } from './Notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/CommandPalette';

interface HeaderProps {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    title?: string;
    subtitle?: string;
}

export function Header({ isDarkMode, toggleDarkMode, title, subtitle }: HeaderProps) {
    const [user, setUser] = useState<Profile | null>(null);
    const [openCommand, setOpenCommand] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profile) setUser(profile);
            }
        };
        fetchUser();
    }, []);

    const getInitials = (name: string | null) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <header className="h-16 bg-background border-b border-sidebar-border flex items-center justify-between px-6 transition-all duration-300">
            {/* Left: Title & Subtitle */}
            <div className="flex items-center gap-4">
                {title && (
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                            {title}
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                                Sistema Online
                            </span>
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{subtitle}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Search, Theme, Notifications, User */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative w-64 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 pr-10 h-9 rounded-xl bg-muted/50 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                        readOnly
                        onClick={() => setOpenCommand(true)}
                        onFocus={() => setOpenCommand(true)}
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded font-mono pointer-events-none">
                        ⌘K
                    </kbd>
                </div>

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="h-9 w-9 rounded-full hover:bg-muted text-foreground"
                >
                    {isDarkMode ? (
                        <Sun className="w-4 h-4" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                </Button>

                {/* Notifications */}
                <Notifications userId={user?.id} />

                {/* User Avatar */}
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-none text-foreground">{user?.name || 'Carregando...'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                            {user?.label || user?.role || '...'}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-background overflow-hidden relative">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-black text-primary-foreground text-xs tracking-wider">
                                {getInitials(user?.name)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <CommandPalette open={openCommand} onOpenChange={setOpenCommand} />
        </header>
    );
}
