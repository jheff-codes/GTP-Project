import { Building2 } from 'lucide-react';

export const LoginHeader = () => {
    return (
        <div className="text-center mb-10 flex flex-col items-center">
            <div className="relative mb-6">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-emerald-500/40 rounded-full blur-[20px] scale-150 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Building2 className="w-8 h-8 text-emerald-500" />
                </div>
            </div>

            <h1 className="text-4xl font-black tracking-widest text-[#f8fafc] uppercase mb-1">
                GTP Smart
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-tight">
                Sistema de Gestão Imobiliária
            </p>
        </div>
    );
};
