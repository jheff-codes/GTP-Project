import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getInitials, getOwnerName } from '../utils/helpers';
import type { Client } from '@/lib/database.types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface RedistribuicaoClientesProps {
    filteredClients: Client[];
    safeClients: Client[];
    brokers: any[];
    leadsEmEspera: Client[];
    selectedForRedistribute: number[];
    handleRedistributeSingle: (clientId: number, brokerId: string) => void;
    handleRedistributeAll: () => void;
    selectAllVisibleLeads: () => void;
    clearSelection: () => void;
    toggleSelection: (clientId: number) => void;
    updateClient: any;
    profiles: any[] | undefined;
}

export const RedistribuicaoClientes = ({
    filteredClients,
    safeClients,
    brokers,
    leadsEmEspera,
    selectedForRedistribute,
    handleRedistributeSingle,
    handleRedistributeAll,
    selectAllVisibleLeads,
    clearSelection,
    toggleSelection,
    updateClient,
    profiles,
}: RedistribuicaoClientesProps) => {
    return (
        <div key="redistribute-view" className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                    <h2 className="font-bold text-lg">Redistribuição de Leads</h2>
                    <p className="text-sm text-muted-foreground">
                        {leadsEmEspera.length} leads sem responsável • {selectedForRedistribute.length} selecionados
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllVisibleLeads}>
                        Selecionar {filteredClients.length} Filtrados
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                        Limpar Seleção
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleRedistributeAll}
                        disabled={updateClient.isPending || (selectedForRedistribute.length === 0 && leadsEmEspera.length === 0)}
                    >
                        {updateClient.isPending ? 'Redistribuindo...' : 'Redistribuir (Aleatório)'}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" disabled={selectedForRedistribute.length === 0}>
                                Enviar para... <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                            {brokers.map(b => (
                                <DropdownMenuItem
                                    key={b.id}
                                    onClick={() => {
                                        selectedForRedistribute.forEach(clientId => handleRedistributeSingle(clientId, b.id));
                                        toast.success(`Enviando ${selectedForRedistribute.length} leads para ${b.name}...`);
                                        clearSelection();
                                    }}
                                >
                                    {b.name} ({b.role})
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Brokers Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {brokers.map((broker) => {
                    const clientCount = safeClients.filter(c => c.owner_id === broker.id).length;
                    return (
                        <div key={broker.id} className="gtp-card text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                                <span className="font-bold text-primary">{getInitials(broker.name)}</span>
                            </div>
                            <p className="font-semibold text-sm truncate">{broker.name}</p>
                            <p className="text-2xl font-black text-primary">{clientCount}</p>
                            <p className="text-xs text-muted-foreground">clientes</p>
                        </div>
                    );
                })}
            </div>

            {/* Leads Table */}
            <div className="gtp-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-4 py-3 w-12"></th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsável Atual</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Atribuir a</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className={cn(
                                    'transition-colors',
                                    !client.owner_id && 'bg-warning/5',
                                    selectedForRedistribute.includes(client.id) && 'bg-primary/10'
                                )}>
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={selectedForRedistribute.includes(client.id)}
                                            onCheckedChange={() => toggleSelection(client.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-primary text-xs">{getInitials(client.name)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{client.name || 'Sem nome'}</p>
                                                <p className="text-xs text-muted-foreground">{client.phone || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {client.cidade || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {client.owner_id ? (
                                            <span className="text-sm">{getOwnerName(client.owner_id, profiles)}</span>
                                        ) : (
                                            <span className="text-sm text-destructive font-medium">Sem responsável</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Select
                                            value={client.owner_id || ''}
                                            onValueChange={(value) => handleRedistributeSingle(client.id, value)}
                                        >
                                            <SelectTrigger className="w-40 h-8">
                                                <SelectValue placeholder="Selecionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brokers.map((broker) => (
                                                    <SelectItem key={broker.id} value={broker.id}>
                                                        {broker.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredClients.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum cliente para redistribuir</p>
                    </div>
                )}
            </div>
        </div>
    );
};
