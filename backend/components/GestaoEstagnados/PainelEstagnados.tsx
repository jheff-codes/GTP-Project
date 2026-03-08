import { Clock, Zap, Key, Link, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { AutomationConfig } from '../../constantes';

interface PainelEstagnadosProps {
    config: AutomationConfig;
    setConfig: (fn: (prev: AutomationConfig | null) => AutomationConfig | null) => void;
}

export function PainelEstagnados({ config, setConfig }: PainelEstagnadosProps) {
    const meta = config.metadata || {};

    const updateMeta = (key: string, value: any) => {
        setConfig(prev => prev ? {
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        } : null);
    };

    return (
        <div className="space-y-10">
            {/* Horário e Grace Period */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Horário e Espera</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expediente e grace period para distribuição</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início Expediente</Label>
                        <Input type="time"
                            value={meta.start_time ?? "08:00"}
                            onChange={(e) => updateMeta('start_time', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fim Expediente</Label>
                        <Input type="time"
                            value={meta.end_time ?? "18:00"}
                            onChange={(e) => updateMeta('end_time', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário de Distribuição</Label>
                        <Input type="time"
                            value={meta.distribution_time ?? "09:00"}
                            onChange={(e) => updateMeta('distribution_time', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo de Espera (min)</Label>
                        <Input type="number" min={0} max={120}
                            value={meta.grace_period_min ?? 0}
                            onChange={(e) => updateMeta('grace_period_min', parseInt(e.target.value) || 0)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-bold text-lg text-white focus:border-amber-500/30 text-center" />
                        <p className="text-[9px] text-slate-600 ml-2">Aguardar após 1º login</p>
                    </div>
                </div>
            </div>

            {/* Credenciais UAZAPI */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-500/10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Credenciais UAZAPI</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuração de envio WhatsApp</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                            <Link className="w-3 h-3" /> URL da API
                        </Label>
                        <Input
                            placeholder="https://iagtp.uazapi.com"
                            value={meta.uazapi_url || ""}
                            onChange={(e) => updateMeta('uazapi_url', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-medium text-sm text-white focus:border-emerald-500/30 font-mono"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                            <Key className="w-3 h-3" /> Token
                        </Label>
                        <Input
                            type="password"
                            placeholder="••••••••••••••"
                            value={meta.uazapi_token || ""}
                            onChange={(e) => updateMeta('uazapi_token', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-medium text-sm text-white focus:border-emerald-500/30 font-mono"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                            <Send className="w-3 h-3" /> Nome da Instância
                        </Label>
                        <Input
                            placeholder="minha-instancia"
                            value={meta.uazapi_instance || ""}
                            onChange={(e) => updateMeta('uazapi_instance', e.target.value)}
                            className="h-14 bg-black/50 border-white/5 rounded-2xl px-6 font-medium text-sm text-white focus:border-emerald-500/30 font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Notificação WhatsApp */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">Notificação WhatsApp</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mensagem enviada ao corretor ao receber lead</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 px-6 py-4 rounded-2xl border border-white/5">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            meta.whatsapp_notification_enabled ? "text-emerald-500" : "text-slate-600"
                        )}>
                            {meta.whatsapp_notification_enabled ? 'Ativo' : 'Desativado'}
                        </span>
                        <Switch
                            checked={meta.whatsapp_notification_enabled || false}
                            onCheckedChange={(val) => updateMeta('whatsapp_notification_enabled', val)}
                            className="data-[state=checked]:bg-emerald-500"
                        />
                    </div>
                </div>

                <Textarea
                    placeholder="*NOVO LEAD CHEGOU* 🚀..."
                    value={meta.whatsapp_notification_prompt || ""}
                    onChange={(e) => updateMeta('whatsapp_notification_prompt', e.target.value)}
                    className="min-h-[200px] bg-black/50 border-white/5 rounded-2xl p-6 font-mono text-sm text-slate-300 focus:border-blue-500/30 resize-none leading-relaxed"
                />

                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Variáveis disponíveis:</span>
                    {['{saudacao}', '{broker_name}', '{lead_name}', '{lead_phone}'].map(v => (
                        <span key={v} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono">{v}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
