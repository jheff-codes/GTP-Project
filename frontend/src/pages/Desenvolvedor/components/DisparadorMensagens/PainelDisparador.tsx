import {
    Clock, ShieldCheck, Zap, Power, Send, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { AutomationConfig } from '../../constantes';

interface PainelDisparadorProps {
    config: AutomationConfig;
    setConfig: (fn: (prev: AutomationConfig | null) => AutomationConfig | null) => void;
}

export function PainelDisparador({ config, setConfig }: PainelDisparadorProps) {
    const meta = config.metadata || {};

    const updateMeta = (key: string, value: any) => {
        setConfig(prev => prev ? {
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        } : null);
    };

    const updateInstance = (idx: number, key: string, value: any) => {
        const current = [...(meta.uazapi_instances || [])];
        current[idx] = { ...current[idx], [key]: value };
        updateMeta('uazapi_instances', current);
    };

    const addInstance = () => {
        const current = meta.uazapi_instances || [];
        updateMeta('uazapi_instances', [
            ...current,
            { name: '', url: 'https://iagtp.uazapi.com', token: '', table_name: '', n8n_chat: '', is_active: true }
        ]);
    };

    const removeInstance = (idx: number) => {
        const current = [...(meta.uazapi_instances || [])];
        current.splice(idx, 1);
        updateMeta('uazapi_instances', current);
    };

    const handleCreateTable = async () => {
        const tableName = meta.dispatch_table;
        const chatTableName = meta.chat_table_name || null;
        if (!tableName) {
            toast.error('Defina o nome da tabela de disparo primeiro.');
            return;
        }
        const confirmMsg = chatTableName
            ? `Criar tabelas '${tableName}' e '${chatTableName}' no banco IMEDIATAMENTE?`
            : `Criar tabela '${tableName}' no banco IMEDIATAMENTE?`;
        if (!confirm(confirmMsg)) return;

        const toastId = toast.loading('Criando tabela(s)...');
        try {
            const rpcParams: Record<string, string> = { table_name: tableName };
            if (chatTableName) rpcParams.chat_table_name = chatTableName;
            const { error } = await supabase.rpc('create_dynamic_dispatch_table', rpcParams as any);
            if (error) throw error;
            const successMsg = chatTableName
                ? `Tabelas '${tableName}' e '${chatTableName}' criadas!`
                : `Tabela '${tableName}' criada com sucesso!`;
            toast.success(successMsg, { id: toastId });
        } catch (error: any) {
            toast.error(`Erro: ${error.message || 'Verifique se a função RPC existe.'}`, { id: toastId });
        }
    };

    return (
        <div className="space-y-8">

            {/* BLOCO 1 — Horário e Limites */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-500/10 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <Clock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Horário e Limites</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Janela de envio e quantidade por ciclo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário Inicial</Label>
                        <Input type="time" value={meta.start_time ?? "08:00"}
                            onChange={(e) => updateMeta('start_time', e.target.value)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário Final</Label>
                        <Input type="time" value={meta.end_time ?? "18:00"}
                            onChange={(e) => updateMeta('end_time', e.target.value)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite por Ciclo</Label>
                        <Input type="number" min={1} max={50}
                            value={meta.limite_disparos ?? 1}
                            onChange={(e) => updateMeta('limite_disparos', parseInt(e.target.value) || 1)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max por Dia</Label>
                        <Input type="number" min={1} max={100}
                            value={meta.max_per_day ?? 10}
                            onChange={(e) => updateMeta('max_per_day', parseInt(e.target.value) || 10)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                </div>
            </div>

            {/* BLOCO 2 — Anti-Ban */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/10 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Anti-Ban (Delay e Alternância)</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protege contra banimento variando o padrão de envio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delay Mínimo (min)</Label>
                        <Input type="number" min={1} max={60} value={meta.delay_minimo ?? 5}
                            onChange={(e) => updateMeta('delay_minimo', parseInt(e.target.value) || 5)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delay Máximo (min)</Label>
                        <Input type="number" min={1} max={60} value={meta.delay_maximo ?? 12}
                            onChange={(e) => updateMeta('delay_maximo', parseInt(e.target.value) || 12)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias Ativos</Label>
                        <Input type="number" min={1} max={7} value={meta.active_days ?? 2}
                            onChange={(e) => updateMeta('active_days', parseInt(e.target.value) || 2)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias de Pausa</Label>
                        <Input type="number" min={1} max={7} value={meta.pause_days ?? 1}
                            onChange={(e) => updateMeta('pause_days', parseInt(e.target.value) || 1)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início do Ciclo</Label>
                        <Input type="date" value={meta.cycle_start_date || ''}
                            onChange={(e) => updateMeta('cycle_start_date', e.target.value)}
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 px-6 py-4 rounded-2xl border border-white/5 w-fit">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors",
                        meta.randomize_pattern ? "text-amber-500" : "text-slate-600"
                    )}>
                        {meta.randomize_pattern ? 'Padrão Aleatório Ativo' : 'Padrão Fixo'}
                    </span>
                    <Switch
                        checked={meta.randomize_pattern || false}
                        onCheckedChange={(val) => updateMeta('randomize_pattern', val)}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </div>
            </div>

            {/* BLOCO 3 — Configurações do Disparo */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/10 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                        <Zap className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Configurações do Disparo</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tabela, instância e dados da IA</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tabela de Disparo</Label>
                        <Input value={meta.dispatch_table || ''}
                            onChange={(e) => updateMeta('dispatch_table', e.target.value)}
                            placeholder="gtp_disparos"
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prefixo da Imob</Label>
                        <Input value={meta.prefix || ''}
                            onChange={(e) => updateMeta('prefix', e.target.value)}
                            placeholder="GTP"
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tabela n8n Chat</Label>
                        <Input value={meta.chat_table_name || ''}
                            onChange={(e) => updateMeta('chat_table_name', e.target.value)}
                            placeholder="ex. chat_lancamento_x"
                            className="bg-black/50 border-white/5 rounded-xl text-white" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleCreateTable}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20">
                        Criar Tabela no Banco
                    </Button>
                </div>
            </div>

            {/* BLOCO 4 — Instâncias UAZAPI (Round-Robin) */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-500/10 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">Credenciais UAZAPI</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instâncias para envio (Round-Robin)</p>
                        </div>
                    </div>
                    <Button onClick={addInstance}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                        + Nova Instância
                    </Button>
                </div>

                <div className="space-y-4">
                    {(meta.uazapi_instances || []).map((inst: any, idx: number) => (
                        <div key={idx} className={cn(
                            "p-6 rounded-2xl border space-y-4 relative group transition-all duration-300",
                            inst.is_active === false
                                ? "bg-black/20 border-white/[0.03] opacity-40"
                                : "bg-black/40 border-white/5"
                        )}>
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest transition-colors",
                                        inst.is_active === false ? "text-slate-600" : "text-emerald-500"
                                    )}>
                                        {inst.is_active === false ? 'Pausada' : 'Ativa'}
                                    </span>
                                    <Switch
                                        checked={inst.is_active !== false}
                                        onCheckedChange={(val) => updateInstance(idx, 'is_active', val)}
                                        className="data-[state=checked]:bg-emerald-500 scale-90"
                                    />
                                </div>
                                <button onClick={() => removeInstance(idx)}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                    <Power className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nome da Instância</Label>
                                    <Input value={inst.name} onChange={(e) => updateInstance(idx, 'name', e.target.value)}
                                        placeholder="Ex: Comercial 1"
                                        className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">URL da API</Label>
                                    <Input value={inst.url} onChange={(e) => updateInstance(idx, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Token</Label>
                                    <Input type="password" value={inst.token} onChange={(e) => updateInstance(idx, 'token', e.target.value)}
                                        placeholder="••••••"
                                        className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tabela Vinculada</Label>
                                    <Input value={inst.table_name || ''} onChange={(e) => updateInstance(idx, 'table_name', e.target.value)}
                                        placeholder="ex. prefix_disparos"
                                        className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Identificador n8n</Label>
                                    <Input value={inst.n8n_chat || ''} onChange={(e) => updateInstance(idx, 'n8n_chat', e.target.value)}
                                        placeholder="ex. nome_n8n_chat"
                                        className="h-10 bg-black/50 border-white/5 rounded-xl text-xs text-white" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {(meta.uazapi_instances || []).length === 0 && (
                        <div className="p-8 rounded-2xl bg-black/20 border border-white/5 border-dashed flex flex-col items-center justify-center gap-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nenhuma instância configurada</p>
                            <p className="text-[10px] text-slate-700">Clique em "+ Nova Instância" para começar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BLOCO 5 — Mensagens Follow-Up com Variantes */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-violet-900/20 to-transparent border border-violet-500/10 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                        <Send className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Mensagens de Follow-Up — Variantes</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cada slot sorteia 1 variante aleatória por lead (anti-ban)</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {[1, 2].map(n => {
                        const variantKey = `mensagem_${n}_variants`;
                        const legacyKey = `mensagem_${n}`;
                        const variants: string[] = (meta as any)?.[variantKey]
                            || ((meta as any)?.[legacyKey] ? [(meta as any)[legacyKey]] : []);

                        return (
                            <div key={n} className="space-y-3 p-5 rounded-2xl bg-black/20 border border-white/5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                                        Mensagem {n} {n === 1 ? '(Obrigatória)' : '(Opcional)'} — {variants.length} variante{variants.length !== 1 ? 's' : ''}
                                    </Label>
                                    <button
                                        onClick={() => updateMeta(variantKey, [...variants, ''])}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-black uppercase tracking-widest hover:bg-violet-500/20 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Variante
                                    </button>
                                </div>

                                {variants.length === 0 && (
                                    <div className="p-4 rounded-xl bg-black/30 border border-white/5 border-dashed text-center">
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                            {n === 1 ? 'Clique em "+ Variante" para adicionar a primeira mensagem' : 'Nenhuma variante — slot será pulado'}
                                        </p>
                                    </div>
                                )}

                                {variants.map((v: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="mt-4 text-[10px] font-bold text-violet-400/60 uppercase tracking-widest min-w-[16px]">{idx + 1}</span>
                                        <Textarea
                                            value={v}
                                            onChange={(e) => {
                                                const updated = [...variants];
                                                updated[idx] = e.target.value;
                                                updateMeta(variantKey, updated);
                                            }}
                                            placeholder={n === 1 && idx === 0 ? 'Ex: Prazer, sou {nome_ia}, consultor especialista...' : `Variante ${idx + 1}`}
                                            className="flex-1 min-h-[60px] bg-black/50 border-white/5 rounded-2xl p-4 font-mono text-sm text-slate-300 focus:border-violet-500/30 resize-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const updated = variants.filter((_: string, i: number) => i !== idx);
                                                updateMeta(variantKey, updated);
                                            }}
                                            className="mt-3 p-2 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Variáveis disponíveis:</span>
                    {['{nome}', '{nome_instancia}', '{saudacao}'].map(v => (
                        <span key={v} className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold font-mono">{v}</span>
                    ))}
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">💬 Fluxo: Digitando... → Msg 1 → Digitando... → Msg 2</span>
                </div>
            </div>
        </div>
    );
}
