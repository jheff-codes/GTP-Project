import { useState, useEffect } from 'react';
import { Building2, Lock, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';
import { type AccessSchedule, type Config } from '../hooks/useConfiguracoes';

interface InfoImobiliariaProps {
    agencyId: string;
    profiles: Profile[] | undefined;
    compact?: boolean;
}

export function InfoImobiliaria({ agencyId, profiles, compact = false }: InfoImobiliariaProps) {
    const [agencyConfig, setAgencyConfig] = useState<Partial<Config> | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const agencyProfile = profiles?.find(p => p.id === agencyId);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('prefix, name, creci, address')
                    .eq('id', agencyId)
                    .single();

                let { data: autoData } = await (supabase as any)
                    .from('automation_settings')
                    .select('metadata')
                    .eq('name', 'broker_management')
                    .eq('agency_id', agencyId)
                    .maybeSingle();

                if (!autoData) {
                    const { data: globalData } = await (supabase as any)
                        .from('automation_settings')
                        .select('metadata')
                        .eq('name', 'broker_management')
                        .is('agency_id', null)
                        .maybeSingle();
                    autoData = globalData;
                }

                const combinedConfig = {
                    ...profileData,
                    ...autoData?.metadata as any,
                };

                setAgencyConfig(combinedConfig as Config);
            } catch {
                setAgencyConfig(null);
            } finally {
                setLoadingConfig(false);
            }
        };
        if (agencyId) fetchConfig();
    }, [agencyId]);

    if (loadingConfig) {
        return <div className="gtp-card animate-pulse h-48 bg-muted/30" />;
    }

    if (!agencyProfile) return null;

    return (
        <div className="gtp-card border-l-4 border-l-amber-500/50">
            <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-black uppercase tracking-wide">Informações da Sua Imobiliária</h2>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Gerenciado pelo Admin
                    </span>
                </div>
            </div>

            {!compact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Imobiliária</span>
                        <p className="font-bold text-lg">{agencyProfile.name || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CRECI</span>
                        <p className="font-bold text-lg">{agencyProfile.creci || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prefixo</span>
                        <p className="font-bold text-lg text-primary">{agencyConfig?.prefix || 'Não definido'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço</span>
                        <p className="font-medium">{agencyProfile.address || 'Não informado'}</p>
                    </div>
                </div>
            )}

            {agencyConfig && (
                <div className="mt-6 pt-6 border-t border-border/50">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Horário de Expediente
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Início</span>
                            <p className="text-2xl font-black">{agencyConfig.checkin_start || '09:00'}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Término</span>
                            <p className="text-2xl font-black">{agencyConfig.checkin_end || '18:00'}</p>
                        </div>
                    </div>

                    {Array.isArray(agencyConfig.access_schedules) && agencyConfig.access_schedules.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Janelas de Check-in</h4>
                            <div className="flex flex-wrap gap-2">
                                {(agencyConfig.access_schedules as AccessSchedule[]).map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold">
                                        {s.start} - {s.end}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
