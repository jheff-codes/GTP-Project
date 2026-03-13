import { Router, Globe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WEEKDAYS, type Config } from '../hooks/useConfiguracoes';

interface ControleIPProps {
    config: Partial<Config>;
    setConfig: React.Dispatch<React.SetStateAction<Partial<Config>>>;
    loading: boolean;
    onSave: () => void;
    toggleDay: (dayId: number) => void;
    fetchMyIp: () => void;
}

export function ControleIP({ config, setConfig, loading, onSave, toggleDay, fetchMyIp }: ControleIPProps) {
    return (
        <div className="gtp-card border-l-4 border-l-blue-500/50">
            <div className="flex items-center gap-3 mb-6">
                <Router className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-black uppercase tracking-wide">Controle de Sede (IP)</h2>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl border border-dashed text-center mb-6">
                <p className="text-sm text-muted-foreground">
                    Defina aqui os endereços IP da sua imobiliária e os dias em que o acesso presencial é obrigatório.
                    <br />
                    <span className="text-xs opacity-70">Essas regras são aplicadas localmente para sua equipe.</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* IP Required Days */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Dias com Restrição de IP</h3>
                        <p className="text-xs text-muted-foreground">Em quais dias o acesso deve ser feito APENAS da imobiliária (IP Autorizado)?</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                            const isSelected = (config.ip_required_days || []).includes(day.id);
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border-2",
                                        isSelected
                                            ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-card border-border hover:border-blue-500/50 hover:bg-muted"
                                    )}
                                >
                                    {day.full}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Allowed IPs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider mb-1">IPs Autorizados</h3>
                            <p className="text-xs text-muted-foreground">Apenas estes IPs poderão fazer check-in nos dias marcados acima.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchMyIp} className="text-xs gap-2 h-8">
                            <Globe className="w-3 h-3" /> Meu IP Atual
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ex: 192.168.1.1"
                                id="ip-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value;
                                        if (val && !config.allowed_ips?.includes(val)) {
                                            setConfig({ ...config, allowed_ips: [...(config.allowed_ips || []), val] });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <Button onClick={() => {
                                const input = document.getElementById('ip-input') as HTMLInputElement;
                                if (input.value && !config.allowed_ips?.includes(input.value)) {
                                    setConfig({ ...config, allowed_ips: [...(config.allowed_ips || []), input.value] });
                                    input.value = '';
                                }
                            }}>Adicionar</Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {config.allowed_ips?.map((ip) => (
                                <div key={ip} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border group animate-in zoom-in-50 duration-200">
                                    <span className="text-sm font-mono font-bold text-foreground">{ip}</span>
                                    <button
                                        onClick={() => setConfig({ ...config, allowed_ips: config.allowed_ips?.filter(i => i !== ip) })}
                                        className="text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {(!config.allowed_ips || config.allowed_ips.length === 0) && (
                                <p className="text-xs text-muted-foreground italic p-2">Nenhum IP autorizado cadastrado.</p>
                            )}
                        </div>
                    </div>
                </div>

                <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={onSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Configurações de IP'}
                </Button>
            </div>
        </div>
    );
}
