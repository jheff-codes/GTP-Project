import { Filter } from 'lucide-react';
import { FUNNEL_STAGES, FUNNEL_STAGES_ORDER } from '../constantes';

interface FunilVendasProps {
    filteredClients: any[];
}

export const FunilVendas = ({ filteredClients }: FunilVendasProps) => {
    const getStageIndex = (status: string | null) => {
        if (!status || status === '') return -1;
        return FUNNEL_STAGES_ORDER.indexOf(status.toLowerCase());
    };

    const getCumulativeCountFiltered = (stageIndex: number) => {
        return filteredClients.filter(c => {
            const clientStageIndex = getStageIndex(c.status);
            return clientStageIndex !== -1 && clientStageIndex >= stageIndex;
        }).length || 0;
    };

    const getExactCountFiltered = (status: string) => {
        if (status === 'disparo') {
            return filteredClients?.filter(c => !c.status || c.status === 'disparo' || c.status === '').length || 0;
        }
        return filteredClients?.filter(c => c.status?.toLowerCase() === status.toLowerCase()).length || 0;
    };

    return (
        <div className="gtp-card lg:col-span-2 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <span className="micro-label flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    Funil de Vendas
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-between relative px-8 py-4 overflow-y-auto custom-scroll">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 z-0 flex flex-col justify-between px-8 py-4 opacity-10 pointer-events-none">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className="w-full border-b border-foreground/50 h-0" />
                    ))}
                </div>

                {/* Funnel Bars */}
                {FUNNEL_STAGES.map((stage, index) => {
                    const cumulativeCount = getCumulativeCountFiltered(index);
                    const totalStages = FUNNEL_STAGES.length;
                    const maxInset = 40;
                    const step = maxInset / totalStages;
                    const topInset = index * step;
                    const bottomInset = (index + 1) * step;

                    return (
                        <div key={stage.key} className="w-full h-10 relative -mb-0.5 last:mb-0 z-10 hover:z-20 transition-all duration-300 group"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                        >
                            <div
                                className="w-full h-full text-white transition-transform group-hover:scale-[1.02] flex items-center justify-center"
                                style={{
                                    backgroundColor: stage.color,
                                    clipPath: `polygon(${topInset}% 0%, ${100 - topInset}% 0%, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-widest drop-shadow-md">
                                        {stage.label}
                                    </span>
                                    <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-full drop-shadow-md">
                                        {cumulativeCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                    * Contagem cumulativa: cada etapa inclui clientes nela ou em etapas posteriores
                </p>
            </div>
        </div>
    );
};
