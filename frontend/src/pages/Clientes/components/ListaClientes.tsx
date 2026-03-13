import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getLeadScore } from '@/utils/leadScoring';
import { getInitials, formatCurrency, getOwnerName } from '../utils/helpers';
import type { Client } from '@/lib/database.types';

interface ListaClientesProps {
    filteredClients: Client[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onClientClick: (client: Client) => void;
    profiles: any[] | undefined;
}

export const ListaClientes = ({
    filteredClients,
    searchTerm,
    setSearchTerm,
    onClientClick,
    profiles,
}: ListaClientesProps) => {
    return (
        <div key="list-view" className="gtp-card overflow-hidden p-0 animate-fade-in">
            {/* Search */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quartos</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo Imóvel</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modo Compra</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Serviço</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IR</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Renda</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsável</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredClients.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() => onClientClick(client)}
                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <span className="font-bold text-primary text-xs">{getInitials(client.name)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate text-primary">{client.name || 'Sem nome'}</p>
                                            <p className="text-xs text-muted-foreground">{client.phone || '-'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                                            !client.status || client.status === '' ? 'bg-slate-500/20 text-slate-500' :
                                                client.status === 'lead' ? 'bg-blue-500/20 text-blue-500' :
                                                    client.status === 'sale' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        client.status === 'discarded' ? 'bg-destructive/20 text-destructive' :
                                                            'bg-primary/20 text-primary'
                                        )}>
                                            {!client.status || client.status === '' ? 'DISPARO' : client.status}
                                        </span>
                                        <span title={getLeadScore(client).label} className="text-xs cursor-help">{getLeadScore(client).icon}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.cidade || '-'}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.bairro || '-'}</td>
                                <td className="px-4 py-3 text-center text-sm text-muted-foreground">{client.quartos || '-'}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.tipo_imovel || '-'}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.modo_compra || '-'}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.tipo_servico || '-'}</td>
                                <td className="px-4 py-3 text-center text-sm text-muted-foreground">{client.declara_ir || '-'}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-primary">{formatCurrency(client.renda)}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{getOwnerName(client.owner_id, profiles)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredClients.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                </div>
            )}
        </div>
    );
};
