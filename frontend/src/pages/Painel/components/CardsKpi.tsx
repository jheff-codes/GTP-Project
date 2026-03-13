import { Users, Building2, Calendar, TrendingUp, TrendingDown, Bot } from 'lucide-react';

interface CardsKpiProps {
    totalClients: number;
    totalImoveis: number;
    visitasCount: number;
    conversionRate: string;
    totalLeadsDisparo: number;
    monthChange?: number;
}

export const CardsKpi = ({
    totalClients,
    totalImoveis,
    visitasCount,
    conversionRate,
    totalLeadsDisparo,
    monthChange = 0,
}: CardsKpiProps) => {
    const isPositive = monthChange >= 0;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* TOTAL DE CLIENTES */}
            <div className="gtp-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="micro-label text-muted-foreground mb-1 block">Total de Clientes</span>
                        <span className="text-3xl font-black tracking-tight">{totalClients}</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
                <div className={`mt-4 flex items-center gap-2 text-xs font-medium ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'} w-fit px-2 py-1 rounded-lg`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{monthChange}% mês
                </div>
            </div>

            {/* IMÓVEIS */}
            <div className="gtp-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="micro-label text-muted-foreground mb-1 block">Imóveis Ativos</span>
                        <span className="text-3xl font-black tracking-tight">{totalImoveis}</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Building2 className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Base atualizada</div>
            </div>

            {/* VISITAS */}
            <div className="gtp-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="micro-label text-muted-foreground mb-1 block">Visitas Agendadas</span>
                        <span className="text-3xl font-black tracking-tight">{visitasCount}</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Nesta semana</div>
            </div>

            {/* CONVERSÃO */}
            <div className="gtp-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="micro-label text-muted-foreground mb-1 block">Taxa de Conversão</span>
                        <span className="text-3xl font-black tracking-tight">{conversionRate}%</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Leads &rarr; Vendas</div>
            </div>

            {/* DISPAROS */}
            <div className="gtp-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="micro-label text-muted-foreground mb-1 block">Disparos da Agência</span>
                        <span className="text-3xl font-black tracking-tight">{totalLeadsDisparo}</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Bot className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Campanhas ativas</div>
            </div>
        </div>
    );
};
