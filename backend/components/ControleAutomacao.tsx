import {
    Power, Play, Square, Activity, Clock, Save, Loader2,
    Globe, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { AutomationConfig, ConfigScope } from '../constantes';
import { AUTOMATIONS, type Agency } from '../constantes';

interface ControleAutomacaoProps {
    config: AutomationConfig | null;
    configScope: ConfigScope;
    loading: boolean;
    saving: boolean;
    progressData: { current_action: string; progress_percent: number };
    instanceProgress: Record<string, { percent: number; action: string }>;
    activeAutomation: string;
    isGlobal: boolean;
    selectedAgency: string;
    agencies: Agency[];
    setSelectedAgency: (val: string) => void;
    setConfig: (fn: (prev: AutomationConfig | null) => AutomationConfig | null) => void;
    onSave: () => void;
    onReset: () => void;
    onToggleStatus: (status: 'RUNNING' | 'STOPPED') => void;
    children?: React.ReactNode; // Slot para painéis específicos
}

export function ControleAutomacao({
    config,
    configScope,
    loading,
    saving,
    progressData,
    instanceProgress,
    activeAutomation,
    isGlobal,
    selectedAgency,
    agencies,
    setSelectedAgency,
    setConfig,
    onSave,
    onReset,
    onToggleStatus,
    children,
}: ControleAutomacaoProps) {
    const currentAutomation = AUTOMATIONS.find(a => a.id === activeAutomation);

    return (
        <div className="col-span-12 xl:col-span-12 space-y-8 h-full">
            {/* Seletor de Unidade (quando não-global) */}
            {!isGlobal && (
                <Card className="bg-[#0f1115] border-white/5 rounded-[2rem] p-8 flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <Building2 className="w-6 h-6 text-brand-500" />
                    </div>
                    <div className="flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Unidade Selecionada</Label>
                        <select
                            className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-brand-500/50 transition-all cursor-pointer"
                            value={selectedAgency}
                            onChange={(e) => setSelectedAgency(e.target.value)}
                        >
                            <option value="all">Selecione uma Imobiliária...</option>
                            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </Card>
            )}

            <Card className="bg-[#0f1115] border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500/0 via-brand-500/50 to-brand-500/0" />
                <div className="p-10 space-y-12">
                    {/* Título */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Configurações</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{currentAutomation?.name}</p>
                        </div>
                    </div>

                    {/* Badge de Escopo */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-xl border",
                                configScope === 'global' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                    configScope === 'local_custom' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                        "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            )}>
                                {configScope === 'global' ? <Globe className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase text-white tracking-widest">
                                        {configScope === 'global' ? 'Modo Global' :
                                            configScope === 'local_custom' ? 'Personalizado' : 'Herdado (Global)'}
                                    </h3>
                                    {configScope === 'local_custom' && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider">
                                            Ativo
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {configScope === 'global'
                                        ? 'As alterações aqui afetam todas as unidades sem configuração própria.'
                                        : configScope === 'local_custom'
                                            ? 'Esta unidade tem regras próprias que ignoram o padrão Global.'
                                            : 'Esta unidade está seguindo as regras Globais. Salve para criar uma exceção.'}
                                </p>
                            </div>
                        </div>

                        {configScope === 'local_custom' && (
                            <Button
                                onClick={onReset}
                                variant="destructive"
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 uppercase text-xs font-black tracking-wider"
                            >
                                Excluir Personalização
                            </Button>
                        )}
                    </div>

                    {/* Controle Start / Stop */}
                    <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-[2rem]">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-full transition-colors",
                                config?.automation_status === 'RUNNING' ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-800 text-slate-500"
                            )}>
                                <Power className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase text-white tracking-tight">Controle da Automação</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {config?.automation_status === 'RUNNING'
                                        ? '🟢 Automação em execução'
                                        : '🔴 Automação parada'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => onToggleStatus('RUNNING')}
                                disabled={config?.automation_status === 'RUNNING' || saving}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    config?.automation_status === 'RUNNING'
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 cursor-default"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                )}
                            >
                                <Play className="w-4 h-4" /> Start
                            </Button>
                            <Button
                                onClick={() => onToggleStatus('STOPPED')}
                                disabled={config?.automation_status === 'STOPPED' || saving}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    config?.automation_status === 'STOPPED'
                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 cursor-default"
                                        : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                                )}
                            >
                                <Square className="w-4 h-4" /> Stop
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando...</span>
                        </div>
                    ) : config && (
                        <div className="space-y-10">
                            {/* Progress bar (automações genéricas) */}
                            {config.automation_status === 'RUNNING' && activeAutomation !== 'message_dispatch' && (
                                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-900/10 to-transparent border border-emerald-500/10 space-y-4 animate-in fade-in duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Activity className="w-5 h-5 text-emerald-500" />
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Atividade em Tempo Real</span>
                                        </div>
                                        <span className="text-2xl font-black text-white tabular-nums">
                                            {progressData.progress_percent}%
                                        </span>
                                    </div>
                                    <div className="relative h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${progressData.progress_percent}%`,
                                                background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                                                boxShadow: progressData.progress_percent > 0 ? '0 0 16px rgba(16,185,129,0.4)' : 'none'
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 truncate">
                                        <span className="text-emerald-500/60">▸</span> {progressData.current_action}
                                    </p>
                                </div>
                            )}

                            {/* Progress por instância (Dispatch) */}
                            {activeAutomation === 'message_dispatch' && config.automation_status === 'RUNNING' && Object.keys(instanceProgress).length > 0 && (
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/10 space-y-6 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="relative">
                                            <Activity className="w-5 h-5 text-cyan-500" />
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-white">Progresso por Instância</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{Object.keys(instanceProgress).length} instância(s) ativa(s)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(instanceProgress).map(([name, data]: [string, any]) => (
                                            <div key={name} className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${data.percent >= 100 ? "bg-emerald-500" :
                                                            data.percent > 0 ? "bg-cyan-500 animate-pulse" : "bg-slate-600"
                                                            }`} />
                                                        <span className="text-xs font-black uppercase tracking-widest text-white">{name}</span>
                                                    </div>
                                                    <span className="text-xl font-black text-white tabular-nums">
                                                        {data.percent ?? 0}%
                                                    </span>
                                                </div>
                                                <div className="relative h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                                        style={{
                                                            width: `${data.percent ?? 0}%`,
                                                            background: data.percent >= 100
                                                                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                                                : 'linear-gradient(90deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)',
                                                            boxShadow: (data.percent ?? 0) > 0
                                                                ? data.percent >= 100 ? '0 0 12px rgba(16,185,129,0.4)' : '0 0 12px rgba(6,182,212,0.4)'
                                                                : 'none'
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs font-medium text-slate-400 truncate">
                                                    <span className="text-cyan-500/60">▸</span> {data.action || 'Aguardando...'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Intervalo de Varredura */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Varredura (Minutos)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                                        <Input
                                            type="number"
                                            value={config.interval_minutes}
                                            onChange={(e) => setConfig(prev => prev ? { ...prev, interval_minutes: parseInt(e.target.value) } : null)}
                                            className="h-16 bg-black/50 border-white/5 rounded-2xl pl-16 pr-8 font-black text-xl text-white focus:border-brand-500/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Slot para painéis específicos */}
                            {children}

                            {/* Botão Salvar */}
                            <Button
                                onClick={onSave}
                                disabled={saving || (!isGlobal && selectedAgency === 'all')}
                                className="w-full h-16 bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                Gravar Configurações
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
