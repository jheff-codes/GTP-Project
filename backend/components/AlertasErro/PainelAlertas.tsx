import { AlertCircle, Save, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { ErrorAlertConfig, ErrorAlertMetadata } from '../../constantes';

interface PainelAlertasProps {
    errorAlertConfig: ErrorAlertConfig | null;
    setErrorAlertConfig: (fn: (prev: ErrorAlertConfig | null) => ErrorAlertConfig | null) => void;
    onSave: () => void;
    saving: boolean;
}

export function PainelAlertas({
    errorAlertConfig,
    setErrorAlertConfig,
    onSave,
    saving,
}: PainelAlertasProps) {
    const updateMetaField = (key: keyof ErrorAlertMetadata, value: string) => {
        setErrorAlertConfig(prev =>
            prev ? { ...prev, metadata: { ...prev.metadata, [key]: value } } : null
        );
    };

    const updateActive = (checked: boolean) => {
        setErrorAlertConfig(prev =>
            prev ? { ...prev, is_active: checked, automation_status: checked ? 'RUNNING' : 'STOPPED' } : null
        );
    };

    return (
        <Card className="bg-[#0f1115] border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0" />
            <div className="p-10">
                <div className="space-y-8">
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/10 space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Alertas de Erro via WhatsApp</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receba notificações quando erros críticos ocorrerem</p>
                                </div>
                            </div>
                            <Switch
                                checked={errorAlertConfig?.is_active || false}
                                onCheckedChange={updateActive}
                                className={cn(
                                    "data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-slate-700 border-2 border-transparent",
                                    "shadow-lg transition-all duration-300"
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">URL UAZAPI</Label>
                                <Input
                                    value={errorAlertConfig?.metadata?.uazapi_url || ''}
                                    onChange={(e) => updateMetaField('uazapi_url', e.target.value)}
                                    placeholder="https://iagtp.uazapi.com"
                                    className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Token UAZAPI</Label>
                                <Input
                                    type="password"
                                    value={errorAlertConfig?.metadata?.uazapi_token || ''}
                                    onChange={(e) => updateMetaField('uazapi_token', e.target.value)}
                                    placeholder="••••••"
                                    className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Phone className="w-3 h-3 inline mr-1" />
                                    Telefone Destino
                                </Label>
                                <Input
                                    value={errorAlertConfig?.metadata?.target_phone || ''}
                                    onChange={(e) => updateMetaField('target_phone', e.target.value)}
                                    placeholder="5511999999999"
                                    className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Template da Mensagem de Erro</Label>
                            <Textarea
                                value={errorAlertConfig?.metadata?.message_template || ''}
                                onChange={(e) => updateMetaField('message_template', e.target.value)}
                                placeholder={"⚠️ *ERRO CRÍTICO*\n📍 Local: {local}\n❌ Erro: {erro}\n🕐 Horário: {horario}"}
                                className="min-h-[120px] bg-black/50 border-white/5 rounded-2xl p-6 font-mono text-sm text-slate-300 focus:border-red-500/30 resize-none"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Variáveis disponíveis:</span>
                            {['{local}', '{erro}', '{horario}'].map(v => (
                                <span key={v} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold font-mono">{v}</span>
                            ))}
                        </div>

                        <Button
                            onClick={onSave}
                            disabled={saving}
                            className="w-full h-14 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center justify-center gap-4"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Configurações de Alerta
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
