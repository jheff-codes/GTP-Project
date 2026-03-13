import { Terminal, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { LogEntry, Agency } from '../constantes';

interface ConsoleLogsProps {
    logs: LogEntry[];
    totalLogs: number;
    searchQuery: string;
    currentSearchIndex: number;
    onSearchChange: (value: string) => void;
    onSearchPrev: () => void;
    onSearchNext: () => void;
    logAgencyFilter: string;
    setLogAgencyFilter: (val: string) => void;
    agencies: Agency[];
}

export function ConsoleLogs({
    logs,
    totalLogs,
    searchQuery,
    currentSearchIndex,
    onSearchChange,
    onSearchPrev,
    onSearchNext,
    logAgencyFilter,
    setLogAgencyFilter,
    agencies,
}: ConsoleLogsProps) {
    return (
        <div className="flex flex-col h-full gap-8">
            <Card className="bg-[#0a0c10] border-white/5 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl min-h-[700px]">
                {/* Header do Console */}
                <div className="p-8 border-b border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-5 h-5 text-brand-500" />
                            <h3 className="text-sm font-black uppercase tracking-tighter text-white">Console de Saída</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtrar Unidade:</Label>
                        <select
                            className="bg-black/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-brand-500/50"
                            value={logAgencyFilter}
                            onChange={(e) => setLogAgencyFilter(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Barra de Busca */}
                <div className="flex items-center gap-4 h-14">
                    <div className="relative flex-1 h-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou motivo..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full h-full bg-black/50 border border-white/5 rounded-2xl pl-16 pr-6 text-sm font-medium text-slate-200 outline-none focus:border-brand-500/30 transition-all font-mono"
                        />
                    </div>
                    {searchQuery && (
                        <div className="flex items-center gap-2 bg-black/40 px-4 h-full rounded-2xl border border-white/5">
                            <button
                                onClick={onSearchPrev}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all outline-none"
                            >
                                <ChevronRight className="w-4 h-4 -rotate-90" />
                            </button>
                            <span className="text-[10px] font-black text-white uppercase min-w-[60px] text-center">
                                {totalLogs > 0 ? currentSearchIndex + 1 : 0} / {totalLogs}
                            </span>
                            <button
                                onClick={onSearchNext}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all outline-none"
                            >
                                <ChevronRight className="w-4 h-4 rotate-90" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Log Entries */}
                <div className="p-8 flex-1 overflow-y-auto custom-scroll font-mono text-[13px] space-y-6">
                    {logs.map((log, idx) => (
                        <div
                            key={`${log.source}-${log.id}`}
                            id={`log-${idx}`}
                            className={cn(
                                "flex gap-6 group p-4 rounded-2xl transition-all border border-transparent hover:border-white/5",
                                searchQuery && idx === currentSearchIndex ? "bg-white/5 border-brand-500/20" : "hover:bg-white/5"
                            )}
                        >
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                <span className="text-slate-700 tabular-nums font-bold text-[10px]">
                                    {new Date(log.created_at).toLocaleString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                </span>
                                <span className={cn(
                                    "font-black text-[9px] tracking-[0.2em] px-3 py-1 rounded-full",
                                    log.level === 'ERROR' && "text-red-500 bg-red-500/10",
                                    log.level === 'WARNING' && "text-amber-500 bg-amber-500/10",
                                    log.level === 'INFO' && "text-blue-500 bg-blue-500/10",
                                    log.level === 'SUCCESS' && "text-brand-500 bg-brand-500/10"
                                )}>
                                    {log.level}
                                </span>
                                {log.source === 'system' && (
                                    <span className="text-[8px] font-bold text-cyan-500/60 uppercase tracking-widest">SYS</span>
                                )}
                            </div>
                            <p className="text-slate-400 whitespace-pre-wrap leading-relaxed flex-1">
                                {log.message}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
