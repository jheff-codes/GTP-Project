import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trash2, Pencil, Check, X, ChevronDown, Loader2, Database, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTabelaDisparos, type ContatoTabela } from '../hooks/useTabelaDisparos';

interface Instancia {
    name: string;
    table_name: string;
}

interface GerenciadorTabelasProps {
    instancias: Instancia[];
    canDelete?: boolean;
}

export default function GerenciadorTabelas({ instancias, canDelete = false }: GerenciadorTabelasProps) {
    const { dados, loading, selectedTable, fetchDados, atualizarContato, excluirContato, excluirEmMassa } = useTabelaDisparos();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', stats: '' });
    const [deleting, setDeleting] = useState(false);

    // Reset selection on table change
    useEffect(() => { setSelectedIds(new Set()); setEditingId(null); }, [selectedTable]);

    const handleSelectTable = (name: string) => {
        fetchDados(name);
    };

    const toggleId = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === dados.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(dados.map(d => d.id)));
        }
    };

    const startEdit = (c: ContatoTabela) => {
        setEditingId(c.id);
        setEditForm({ name: c.name || '', phone: c.phone || '', stats: c.stats || '' });
    };

    const saveEdit = async () => {
        if (editingId === null) return;
        await atualizarContato(selectedTable, editingId, editForm);
        setEditingId(null);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Excluir ${selectedIds.size} contato${selectedIds.size > 1 ? 's' : ''}?`)) return;
        setDeleting(true);
        await excluirEmMassa(selectedTable, Array.from(selectedIds));
        setSelectedIds(new Set());
        setDeleting(false);
    };

    const handleSingleDelete = async (id: number) => {
        if (!confirm('Excluir este contato?')) return;
        await excluirContato(selectedTable, id);
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    };

    const formatDate = (d: string) => {
        try {
            const date = new Date(d);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} - ${hours}:${minutes}`;
        } catch {
            return d;
        }
    };

    if (instancias.length === 0) return null;

    return (
        <div className="gtp-card">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-500" /> Gerenciamento de Base
                </h3>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                        <select
                            value={selectedTable}
                            onChange={(e) => handleSelectTable(e.target.value)}
                            className="appearance-none w-full sm:w-64 p-2.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none"
                        >
                            <option value="">Selecione uma tabela...</option>
                            {instancias.map(inst => (
                                <option key={inst.table_name} value={inst.table_name}>{inst.name || inst.table_name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {selectedTable && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchDados(selectedTable)}
                            disabled={loading}
                            className="rounded-xl h-10 w-10"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Empty */}
            {!selectedTable && (
                <div className="py-12 text-center">
                    <Database className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Selecione uma tabela para visualizar os contatos.</p>
                </div>
            )}

            {/* Loading */}
            {selectedTable && loading && (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
                </div>
            )}

            {/* Table */}
            {selectedTable && !loading && (
                <>
                    {/* Bulk Actions Bar */}
                    {canDelete && selectedIds.size > 0 && (
                        <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2 duration-200">
                            <span className="text-sm font-bold text-destructive">
                                {selectedIds.size} contato{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"
                            >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Excluir Selecionados
                            </Button>
                        </div>
                    )}

                    {dados.length === 0 ? (
                        <div className="py-12 text-center">
                            <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">Nenhum contato nesta tabela.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-2 px-3 w-10">
                                            <button onClick={toggleAll}>
                                                {selectedIds.size === dados.length
                                                    ? <CheckSquare className="w-4 h-4 text-primary" />
                                                    : <Square className="w-4 h-4 text-muted-foreground" />}
                                            </button>
                                        </th>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nome</th>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telefone</th>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Horário Disparo</th>
                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data de Criação</th>
                                        <th className="text-right py-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-24">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dados.map((c) => {
                                        const isEditing = editingId === c.id;
                                        const isSelected = selectedIds.has(c.id);
                                        return (
                                            <tr key={c.id} className={`border-b border-border/50 last:border-0 transition ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                                                <td className="py-2.5 px-3">
                                                    <button onClick={() => toggleId(c.id)}>
                                                        {isSelected
                                                            ? <CheckSquare className="w-4 h-4 text-primary" />
                                                            : <Square className="w-4 h-4 text-muted-foreground" />}
                                                    </button>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {isEditing ? (
                                                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                            className="w-full p-1.5 rounded-lg border border-primary/30 bg-background text-sm outline-none focus:ring-1 focus:ring-primary/50" />
                                                    ) : (
                                                        <span className="font-medium">{c.name}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {isEditing ? (
                                                        <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                                            className="w-full p-1.5 rounded-lg border border-primary/30 bg-background text-sm outline-none focus:ring-1 focus:ring-primary/50 font-mono" />
                                                    ) : (
                                                        <span className="font-mono text-xs text-muted-foreground">{c.phone}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {isEditing ? (
                                                        <input value={editForm.stats} onChange={e => setEditForm(f => ({ ...f, stats: e.target.value }))}
                                                            className="w-full p-1.5 rounded-lg border border-primary/30 bg-background text-sm outline-none focus:ring-1 focus:ring-primary/50" />
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{c.stats}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {c.dispatch_time || c.horario_disparo ? formatDate(c.dispatch_time || c.horario_disparo) : '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(c.created_at)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            {canDelete && (
                                                                <button onClick={() => handleSingleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="pt-3 text-xs text-muted-foreground text-center">
                                {dados.length} contato{dados.length !== 1 ? 's' : ''} na tabela <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{selectedTable}</code>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
