import { Cpu, Activity, Globe, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '../constantes';

interface HeaderDesenvolvedorProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isGlobal: boolean;
    setIsGlobal: (val: boolean) => void;
}

export function HeaderDesenvolvedor({
    viewMode,
    setViewMode,
    isGlobal,
    setIsGlobal,
}: HeaderDesenvolvedorProps) {
    return (
        <header className="p-6 md:p-10 rounded-[2.5rem] bg-slate-900/50 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-6">
                <div className="p-5 rounded-3xl bg-brand-500/10 text-brand-500 border border-brand-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <Cpu className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                        Desenvolvimento
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-brand-500" /> Visão Geral do Engine Python
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Toggle Config / Logs */}
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 mr-4">
                    <button
                        onClick={() => setViewMode('config')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'config' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Config
                    </button>
                    <button
                        onClick={() => setViewMode('logs')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'logs' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Logs
                    </button>
                </div>

                {/* Toggle Global / Unidade */}
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-[2rem] border border-white/5">
                    <button
                        onClick={() => setIsGlobal(true)}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            isGlobal ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5" /> Global
                    </button>
                    <button
                        onClick={() => setIsGlobal(false)}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            !isGlobal ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" /> Unidade
                    </button>
                </div>
            </div>
        </header>
    );
}
