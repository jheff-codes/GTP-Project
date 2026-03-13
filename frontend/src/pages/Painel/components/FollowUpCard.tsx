import { Users } from 'lucide-react';

interface FollowUpCardProps {
    filteredClients: any[];
}

export const FollowUpCard = ({ filteredClients }: FollowUpCardProps) => {
    const followupCount = filteredClients?.filter(c =>
        c.status?.toLowerCase() === 'followup'
    ).length || 0;

    return (
        <div className="gtp-card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <span className="micro-label flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    Follow-up Manual
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-center">
                    <div className="text-4xl font-black text-orange-500 mb-2">
                        {followupCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Clientes em contato<br/>manual com corretores
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                    * Clientes isolados do funil de IA
                </p>
            </div>
        </div>
    );
};