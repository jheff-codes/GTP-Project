import { useState, useCallback } from 'react';
import { Rocket, Send, Loader2, AlertCircle, Table2, Users, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Skeleton } from '@/components/ui/skeleton';
import UploadContatos, { type Contato } from './components/UploadContatos';
import SeletorInstancias, { type Instancia } from './components/SeletorInstancias';
import GerenciadorTabelas from './components/GerenciadorTabelas';
import { useDisparos } from './hooks/useDisparos';
import { useInstanciasPermitidas } from './hooks/useInstanciasPermitidas';

const Disparos = () => {
    const { data: currentUser, isLoading: userLoading } = useCurrentUser();
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [instancias, setInstancias] = useState<Instancia[]>([]);
    const { distribuir, isDistributing, resultados, limpar } = useDisparos();
    const { allowedInstances } = useInstanciasPermitidas();

    // Filter instances by hierarchy
    const filteredInstancias = allowedInstances === null
        ? instancias
        : instancias.filter(i => allowedInstances.includes(i.name.toLowerCase()));

    const handleParsed = useCallback((parsed: Contato[]) => {
        setContatos(parsed);
        limpar();
    }, [limpar]);

    const handleClear = useCallback(() => {
        setContatos([]);
        limpar();
    }, [limpar]);

    const handleDistribuir = async () => {
        if (!agencyId) return;
        await distribuir(contatos, selectedTables, agencyId);
    };

    const canDistribute = contatos.length > 0 && selectedTables.length > 0 && agencyId;

    // Distribution math
    const perTable = selectedTables.length > 0 ? Math.floor(contatos.length / selectedTables.length) : 0;
    const remainder = selectedTables.length > 0 ? contatos.length % selectedTables.length : 0;

    if (userLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    // Permission helpers
    const hasPermission = (section: string, action: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        const perms = currentUser.parsedPermissions?.[section as keyof typeof currentUser.parsedPermissions];
        if (!perms) return false;
        return (perms as Record<string, boolean>)[action] === true;
    };

    const canView = hasPermission('disparos', 'ver_disparos');
    const canUpload = hasPermission('disparos', 'fazer_disparos');
    const canManage = hasPermission('disparos', 'gerenciar_tabelas_disparos');

    const canDelete = hasPermission('disparos', 'excluir_disparos');

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 animate-fade-in">
                <ShieldAlert className="w-12 h-12 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">Acesso Negado</p>
                <p className="text-sm text-muted-foreground">Você não tem permissão para acessar a Central de Disparos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent border border-indigo-500/20 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/20">
                        <Rocket className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Central de Disparos</h1>
                        <p className="text-muted-foreground text-sm">Upload de contatos e distribuição inteligente entre instâncias</p>
                    </div>
                </div>
            </div>

            {/* Main Content — 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Upload + Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upload */}
                    {canUpload && (
                        <div className="gtp-card">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Send className="w-4 h-4 text-indigo-500" /> Upload de Contatos
                            </h3>
                            <UploadContatos onParsed={handleParsed} onClear={handleClear} />
                        </div>
                    )}

                    {/* Preview */}
                    {contatos.length > 0 && (
                        <div className="gtp-card">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Table2 className="w-4 h-4 text-emerald-500" /> Preview ({Math.min(5, contatos.length)} de {contatos.length} contatos)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nome</th>
                                            <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telefone</th>
                                            <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stats</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contatos.slice(0, 5).map((c, i) => (
                                            <tr key={i} className="border-b border-border/50 last:border-0">
                                                <td className="py-2.5 px-3 font-medium">{c.name}</td>
                                                <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{c.phone}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{c.stats}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {contatos.length > 5 && (
                                <p className="text-xs text-muted-foreground mt-3 text-center">... e mais {contatos.length - 5} contatos</p>
                            )}
                        </div>
                    )}

                    {/* Distribution Results */}
                    {resultados.length > 0 && (
                        <div className="gtp-card">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Resultado da Distribuição</h3>
                            <div className="space-y-2">
                                {resultados.map((r, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${r.sucesso ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                        <div className="flex items-center gap-2">
                                            {r.sucesso
                                                ? <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                : <AlertCircle className="w-4 h-4 text-destructive" />}
                                            <span className="font-mono text-sm">{r.tabela}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-sm">{r.quantidade} contatos</span>
                                            {r.erro && <p className="text-xs text-destructive">{r.erro}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Config Panel */}
                <div className="space-y-6">
                    {/* Instance Selector */}
                    <div className="gtp-card">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" /> Configuração de Distribuição
                        </h3>
                        <SeletorInstancias
                            selectedTables={selectedTables}
                            onTablesChange={setSelectedTables}
                            agencyId={agencyId}
                            onAgencyChange={setAgencyId}
                            onInstanciasFetched={setInstancias}
                            allowedInstances={allowedInstances}
                        />
                    </div>

                    {/* Distribution Math */}
                    {canDistribute && (
                        <div className="gtp-card bg-primary/5 border-primary/20">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">Resumo</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total de Contatos</span>
                                    <span className="font-black text-lg">{contatos.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tabelas Selecionadas</span>
                                    <span className="font-bold">{selectedTables.length}</span>
                                </div>
                                <div className="border-t border-border pt-2 mt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ArrowRight className="w-3 h-3" />
                                        <span>
                                            <strong className="text-foreground">{perTable}</strong> contatos por tabela
                                            {remainder > 0 && <>, +<strong className="text-foreground">{remainder}</strong> extra{remainder > 1 ? 's' : ''} para as primeiras</>}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {canUpload && (
                        <Button
                            onClick={handleDistribuir}
                            disabled={!canDistribute || isDistributing}
                            className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg text-base gap-3"
                            size="lg"
                        >
                            {isDistributing ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Distribuindo...</>
                            ) : (
                                <><Rocket className="w-5 h-5" /> Iniciar Distribuição</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* ═══ GERENCIAMENTO DE BASE ═══ */}
            {canManage && instancias.length > 0 && (
                <>
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Gerenciamento de Base</span>
                        </div>
                    </div>
                    <GerenciadorTabelas instancias={filteredInstancias} canDelete={canDelete} />
                </>
            )}
        </div>
    );
};

export default Disparos;
