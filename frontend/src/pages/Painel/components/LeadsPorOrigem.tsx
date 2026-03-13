import { Users, Shield } from 'lucide-react';

interface LeadsPorOrigemProps {
    leadsByOrigin: Record<string, number>;
    totalLeadsDisparo: number;
    hasPermission: boolean;
}

export const LeadsPorOrigem = ({
    leadsByOrigin,
    totalLeadsDisparo,
    hasPermission,
}: LeadsPorOrigemProps) => {
    if (!hasPermission) {
        return (
            <div className="gtp-card h-full flex items-center justify-center bg-muted/20 border-dashed">
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Sem permissão
                </p>
            </div>
        );
    }

    if (Object.keys(leadsByOrigin).length === 0) {
        return (
            <div className="gtp-card h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Sem leads</p>
            </div>
        );
    }

    return (
        <div className="gtp-card h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/20">
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold">Origem</h3>
                        <p className="text-xs text-muted-foreground">Total: {totalLeadsDisparo}</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(leadsByOrigin).map(([origin, count]) => (
                    <div
                        key={origin}
                        className="p-3 rounded-xl bg-muted/50 border border-border hover:border-blue-500/30 transition-all flex flex-col items-center justify-center text-center"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{origin}</p>
                        <p className="text-2xl font-black text-blue-500">{count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
