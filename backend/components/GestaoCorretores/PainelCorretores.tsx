import { History, Clock, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { AutomationConfig } from '../../constantes';

interface PainelCorretoresProps {
    config: AutomationConfig;
    setConfig: (fn: (prev: AutomationConfig | null) => AutomationConfig | null) => void;
}

export function PainelCorretores({ config, setConfig }: PainelCorretoresProps) {
    const meta = config.metadata || {};

    const updateMeta = (key: string, value: any) => {
        setConfig(prev => prev ? {
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        } : null);
    };

    return (
        <div className="space-y-10">
            {/* Antecipação de Logout */}
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Antecipação de Logout (Minutos)</Label>
                <div className="relative">
                    <History className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                    <Input
                        type="number"
                        value={meta.logout_anticipation_minutes || 0}
                        onChange={(e) => updateMeta('logout_anticipation_minutes', parseInt(e.target.value))}
                        className="h-16 bg-black/50 border-white/5 rounded-2xl pl-16 pr-8 font-black text-xl text-white focus:border-brand-500/30"
                    />
                </div>
            </div>

            {/* Controle de Jornada */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Controle de Jornada</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Defina o expediente e janelas de acesso</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Início Expediente</Label>
                        <Input
                            type="time"
                            value={meta.checkin_start || "08:00"}
                            onChange={(e) => updateMeta('checkin_start', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Fim Expediente</Label>
                        <Input
                            type="time"
                            value={meta.checkin_end || "18:00"}
                            onChange={(e) => updateMeta('checkin_end', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center"
                        />
                    </div>
                </div>

                {/* Janelas de Acesso */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Janelas Permitidas (Pausas/Almoço)</Label>
                        <Button
                            onClick={() => {
                                const schedules = meta.access_schedules || [];
                                updateMeta('access_schedules', [...schedules, { start: '12:00', end: '13:00' }]);
                            }}
                            size="sm"
                            className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Adicionar Janela
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {(meta.access_schedules || []).map((schedule: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={schedule.start}
                                    onChange={(e) => {
                                        const newSchedules = [...(meta.access_schedules || [])];
                                        newSchedules[index] = { ...newSchedules[index], start: e.target.value };
                                        updateMeta('access_schedules', newSchedules);
                                    }}
                                    className="h-10 bg-black/30 border-white/5 rounded-xl px-4 text-sm text-center font-mono"
                                />
                                <span className="text-slate-600 font-black">-</span>
                                <Input
                                    type="time"
                                    value={schedule.end}
                                    onChange={(e) => {
                                        const newSchedules = [...(meta.access_schedules || [])];
                                        newSchedules[index] = { ...newSchedules[index], end: e.target.value };
                                        updateMeta('access_schedules', newSchedules);
                                    }}
                                    className="h-10 bg-black/30 border-white/5 rounded-xl px-4 text-sm text-center font-mono"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newSchedules = [...(meta.access_schedules || [])];
                                        newSchedules.splice(index, 1);
                                        updateMeta('access_schedules', newSchedules);
                                    }}
                                    className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {(!meta.access_schedules || meta.access_schedules.length === 0) && (
                            <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-600 uppercase tracking-wide">
                                Nenhuma janela adicional configurada
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
