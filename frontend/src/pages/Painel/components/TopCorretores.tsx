import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopCorretoresProps {
    availableBrokers: any[];
    filteredClients: any[];
    filterImobiliaria: string;
    hasPermission: boolean;
}

const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const TopCorretores = ({
    availableBrokers,
    filteredClients,
    filterImobiliaria,
    hasPermission,
}: TopCorretoresProps) => {
    if (!hasPermission) {
        return (
            <div className="gtp-card h-full flex items-center justify-center bg-muted/20 border-dashed">
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Sem permissão para ver Top Corretores
                </p>
            </div>
        );
    }

    if (availableBrokers.length === 0) {
        return (
            <div className="gtp-card h-full flex items-center justify-center">
                <p className="text-center text-muted-foreground py-4">Nenhum corretor cadastrado</p>
            </div>
        );
    }

    return (
        <div className="gtp-card h-full">
            <span className="micro-label mb-4 block">Top Corretores (Vendas)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableBrokers
                    .filter(broker => filterImobiliaria === 'all' || broker.agency_id === filterImobiliaria)
                    .map(broker => {
                        const salesCount = filteredClients?.filter(c => c.owner_id === broker.id && c.status?.toLowerCase() === 'venda').length || 0;
                        return { ...broker, salesCount };
                    })
                    .sort((a, b) => b.salesCount - a.salesCount)
                    .slice(0, 6)
                    .map((broker, index) => (
                        <div key={broker.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center relative">
                                {broker.avatar_url ? (
                                    <img src={broker.avatar_url} alt={broker.name || ''} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="font-bold text-primary text-sm">{getInitials(broker.name)}</span>
                                )}
                                {index < 3 && (
                                    <div className={cn(
                                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background",
                                        index === 0 ? "bg-amber-400 text-white" : index === 1 ? "bg-slate-300 text-slate-600" : "bg-amber-700 text-amber-100"
                                    )}>
                                        {index + 1}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm truncate">{broker.name}</p>
                                <p className="text-xs text-muted-foreground">{broker.salesCount} vendas realizadas</p>
                            </div>
                            <span className="text-lg font-black text-primary/20">#{index + 1}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
};
