import { AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AUTOMATIONS } from '../constantes';

interface SidebarConfigProps {
    activeAutomation: string;
    onSelectAutomation: (id: string) => void;
    showErrorAlertPanel: boolean;
    onToggleErrorAlerts: () => void;
}

export function SidebarConfig({
    activeAutomation,
    onSelectAutomation,
    showErrorAlertPanel,
    onToggleErrorAlerts,
}: SidebarConfigProps) {
    return (
        <aside className="col-span-12 lg:col-span-2 space-y-6">
            <Card className="bg-[#0f1115] border-white/5 rounded-[2rem] p-6 space-y-6">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Automações</Label>
                <div className="space-y-2">
                    {AUTOMATIONS.map((aut) => (
                        <button
                            key={aut.id}
                            onClick={() => onSelectAutomation(aut.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all border",
                                activeAutomation === aut.id && !showErrorAlertPanel
                                    ? "bg-brand-500/10 border-brand-500/30 text-white"
                                    : "bg-black/20 border-transparent text-slate-500 hover:bg-white/5"
                            )}
                        >
                            <aut.icon className={cn("w-5 h-5", activeAutomation === aut.id && !showErrorAlertPanel ? "text-brand-500" : "text-slate-600")} />
                            <span className="text-xs font-black uppercase tracking-tight">{aut.name}</span>
                        </button>
                    ))}
                </div>

                {/* Separator + Alertas de Erro */}
                <div className="border-t border-white/5 pt-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">Sistema</Label>
                    <button
                        onClick={onToggleErrorAlerts}
                        className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all border",
                            showErrorAlertPanel
                                ? "bg-red-500/10 border-red-500/30 text-white"
                                : "bg-black/20 border-transparent text-slate-500 hover:bg-white/5"
                        )}
                    >
                        <AlertCircle className={cn("w-5 h-5", showErrorAlertPanel ? "text-red-500" : "text-slate-600")} />
                        <span className="text-xs font-black uppercase tracking-tight">Alertas de Erro</span>
                    </button>
                </div>
            </Card>

            {/* Badge MODO ROOT */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-brand-600 to-emerald-800 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <ShieldCheck className="w-20 h-20" />
                </div>
                <h4 className="text-xl font-black leading-none mb-2">MODO ROOT</h4>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Acesso restrito ao administrador do sistema.</p>
            </div>
        </aside>
    );
}
