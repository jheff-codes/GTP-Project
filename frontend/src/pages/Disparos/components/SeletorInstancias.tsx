import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CheckSquare, Square, Loader2, Building2, ChevronDown } from 'lucide-react';

export interface Instancia {
    name: string;
    table_name: string;
    is_active: boolean;
}

interface SeletorInstanciasProps {
    selectedTables: string[];
    onTablesChange: (tables: string[]) => void;
    agencyId: string | null;
    onAgencyChange: (id: string) => void;
    onInstanciasFetched?: (instancias: Instancia[]) => void;
    allowedInstances?: string[] | null;
}

interface Agency {
    id: string;
    name: string;
}

export default function SeletorInstancias({ selectedTables, onTablesChange, agencyId, onAgencyChange, onInstanciasFetched, allowedInstances }: SeletorInstanciasProps) {
    const { data: currentUser } = useCurrentUser();
    const isAdmin = currentUser?.role === 'admin';

    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [instancias, setInstancias] = useState<Instancia[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch agencies list (admin only)
    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            const { data } = await (supabase as any)
                .from('profiles')
                .select('id, name')
                .or('role.eq.imobiliaria,role.eq.admin')
                .order('name');
            if (data) setAgencies(data);
        })();
    }, [isAdmin]);

    // Set initial agency
    useEffect(() => {
        if (!currentUser) return;
        if (!agencyId) {
            const newAgencyId = isAdmin ? '' : (currentUser.agency_id || currentUser.id);
            console.log('[DEBUG_INIT] currentUser:', currentUser.id, 'isAdmin:', isAdmin, 'agencyId:', newAgencyId);
            onAgencyChange(newAgencyId);
        }
    }, [currentUser, isAdmin, agencyId, onAgencyChange]);

    // Fetch instances from automation_settings
    useEffect(() => {
        if (!agencyId) { setInstancias([]); setLoading(false); return; }
        setLoading(true);

        (async () => {
            try {
                console.log('[DEBUG] Buscando instâncias para agencyId:', agencyId);
                
                // Get current session to debug token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.user_metadata) {
                    console.log('[DEBUG] Current session user_metadata.agency_id:', session.user.user_metadata.agency_id);
                }
                
                const { data } = await (supabase as any)
                    .from('automation_settings')
                    .select('metadata')
                    .eq('name', 'message_dispatch')
                    .eq('agency_id', agencyId)
                    .maybeSingle();

                console.log('[DEBUG] Resposta do Supabase:', data);
                
                if (data) {
                    console.log('[DEBUG] Data existe. Metadata:', data.metadata);
                    console.log('[DEBUG] uazapi_instances:', data.metadata?.uazapi_instances);
                }

                if (data?.metadata?.uazapi_instances) {
                    const raw = data.metadata.uazapi_instances as Instancia[];
                    console.log('[DEBUG] Instâncias bruta (total):', raw.length);
                    const filtered = raw.filter(i => i.table_name && i.is_active !== false);
                    console.log('[DEBUG] Instâncias filtrada (ativa):', filtered.length, filtered);
                    setInstancias(filtered);
                    onInstanciasFetched?.(filtered);
                } else {
                    console.log('[DEBUG] Nenhuma instância encontrada (data ou uazapi_instances vazio)');
                    setInstancias([]);
                    onInstanciasFetched?.([]);
                }
            } catch (error) {
                console.error('[DEBUG] Erro ao buscar instâncias:', error);
                setInstancias([]);
            } finally {
                console.log('[DEBUG] Fetch completo');
                setLoading(false);
            }
        })();
    }, [agencyId]);

    // Filter by hierarchy if allowedInstances is provided
    const visibleInstancias = allowedInstances === null || allowedInstances === undefined
        ? instancias
        : instancias.filter(i => allowedInstances.includes(i.name.toLowerCase()));

    const allSelected = visibleInstancias.length > 0 && selectedTables.length === visibleInstancias.length;

    const toggleAll = () => {
        if (allSelected) {
            onTablesChange([]);
        } else {
            onTablesChange(visibleInstancias.map(i => i.table_name));
        }
    };

    const toggleTable = (tableName: string) => {
        if (selectedTables.includes(tableName)) {
            onTablesChange(selectedTables.filter(t => t !== tableName));
        } else {
            onTablesChange([...selectedTables, tableName]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Admin: Agency Selector */}
            {isAdmin && (
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                        <Building2 className="w-3 h-3 inline mr-1" /> Selecione a Imobiliária
                    </label>
                    <div className="relative">
                        <select
                            value={agencyId || ''}
                            onChange={(e) => { onAgencyChange(e.target.value); onTablesChange([]); }}
                            className="w-full appearance-none p-3 pr-10 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition"
                        >
                            <option value="">Selecione...</option>
                            {agencies.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Instances List */}
            {loading ? (
                <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando instâncias...
                </div>
            ) : visibleInstancias.length === 0 ? (
                agencyId ? (
                    <div className="p-5 rounded-xl bg-muted/50 border border-border border-dashed text-center">
                        <p className="text-sm text-muted-foreground font-medium">Nenhuma instância vinculada ao seu perfil ou equipe.</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Verifique com o administrador se suas instâncias estão configuradas.</p>
                    </div>
                ) : null
            ) : (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Tabelas de Destino ({selectedTables.length}/{visibleInstancias.length})
                    </label>

                    {/* Select All */}
                    <button
                        onClick={toggleAll}
                        className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:bg-muted/50 transition-all text-left"
                    >
                        {allSelected
                            ? <CheckSquare className="w-5 h-5 text-primary" />
                            : <Square className="w-5 h-5 text-muted-foreground" />}
                        <span className="text-sm font-bold">Selecionar Todas</span>
                    </button>

                    {/* Individual */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {visibleInstancias.map(inst => {
                            const checked = selectedTables.includes(inst.table_name);
                            return (
                                <button
                                    key={inst.table_name}
                                    onClick={() => toggleTable(inst.table_name)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                                        ${checked
                                            ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border hover:bg-muted/50'}`}
                                >
                                    {checked
                                        ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                                        : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{inst.name || inst.table_name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">{inst.table_name}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
