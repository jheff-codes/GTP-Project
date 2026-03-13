import React from 'react';

interface InfoCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number | null;
    color?: string;
    highlight?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, color = 'text-brand-500', highlight = false }) => (
    <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:border-brand-500/30 ${highlight ? 'bg-brand-50/50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
        <div className={`p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{value || '-'}</p>
        </div>
    </div>
);

interface RuleItemProps {
    label: string;
    value: string | null;
}

export const RuleItem: React.FC<RuleItemProps> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
        </div>
    );
};
