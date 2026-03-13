import {
    Globe, Cpu, ShieldCheck, AlertCircle, Key, Clock, History, Zap, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { LogCategory } from '../constantes';

interface SidebarLogsProps {
    activeLogCategory: LogCategory;
    setActiveLogCategory: (cat: LogCategory) => void;
}

const MAIN_CATEGORIES: { id: LogCategory; label: string; icon: typeof Globe }[] = [
    { id: 'all', label: 'Todos', icon: Globe },
    { id: 'automation', label: 'Engine AI', icon: Cpu },
    { id: 'system', label: 'Sistema', icon: ShieldCheck },
];

const SUB_CATEGORIES: { id: LogCategory; label: string; icon: typeof Globe; activeColor: string }[] = [
    { id: 'error', label: 'Erros', icon: AlertCircle, activeColor: 'red' },
    { id: 'login', label: 'Acesso', icon: Key, activeColor: 'blue' },
    { id: 'checkin', label: 'Ponto', icon: Clock, activeColor: 'emerald' },
    { id: 'redistribution', label: 'Redist', icon: History, activeColor: 'purple' },
    { id: 'dispatch', label: 'Disparos', icon: Zap, activeColor: 'cyan' },
    { id: 'notification', label: 'Notif', icon: Bell, activeColor: 'amber' },
];

export function SidebarLogs({ activeLogCategory, setActiveLogCategory }: SidebarLogsProps) {
    return (
        <aside className="col-span-12 lg:col-span-2 space-y-6">
            <Card className="bg-[#0f1115] border-white/5 rounded-[2rem] p-6 space-y-6">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Filtro de Logs</Label>
                <div className="space-y-2">
                    {MAIN_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveLogCategory(cat.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all border",
                                activeLogCategory === cat.id
                                    ? "bg-brand-500/10 border-brand-500/30 text-white"
                                    : "bg-black/20 border-transparent text-slate-500 hover:bg-white/5"
                            )}
                        >
                            <cat.icon className={cn("w-5 h-5", activeLogCategory === cat.id ? "text-brand-500" : "text-slate-600")} />
                            <span className="text-xs font-black uppercase tracking-tight">{cat.label}</span>
                        </button>
                    ))}

                    <div className="h-px bg-white/5 my-4" />

                    <div className="grid grid-cols-2 gap-2">
                        {SUB_CATEGORIES.map((cat) => {
                            const isActive = activeLogCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveLogCategory(cat.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border",
                                        isActive
                                            ? `bg-${cat.activeColor}-500/10 border-${cat.activeColor}-500/30 text-white`
                                            : "bg-black/20 border-transparent text-slate-500 hover:bg-white/5"
                                    )}
                                >
                                    <cat.icon className={cn("w-4 h-4", isActive ? `text-${cat.activeColor}-500` : "text-slate-600")} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </aside>
    );
}
