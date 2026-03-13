import { useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLeadScore } from '@/utils/leadScoring';
import { getInitials, formatCurrency } from '../utils/helpers';
import { KANBAN_COLUMNS } from '../constantes';
import type { Client } from '@/lib/database.types';

interface KanbanClientesProps {
    filteredClients: Client[];
    draggedClient: Client | null;
    onDragStart: (e: React.DragEvent, client: Client) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent, newStatus: string) => void;
    onClientClick: (client: Client) => void;
}

const getClientsByStatus = (clients: Client[], status: string) => {
    return clients.filter(c => {
        if (status === 'repasse') return c.status === 'repasse';
        if (status === 'disparo') return !c.status || c.status === '' || c.status === 'disparo';
        return c.status?.toLowerCase() === status.toLowerCase();
    });
};

export const KanbanClientes = ({
    filteredClients,
    draggedClient,
    onDragStart,
    onDragEnd,
    onDrop,
    onClientClick,
}: KanbanClientesProps) => {
    // Drag to Scroll Refs (internal)
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isDraggingBoard = useRef(false);
    const startX = useRef(0);
    const scrollLeftRef = useRef(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        if ((e.target as HTMLElement).closest('.client-card, button, a, input, select')) return;
        isDraggingBoard.current = true;
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const onMouseLeave = () => {
        isDraggingBoard.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const onMouseUp = () => {
        isDraggingBoard.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingBoard.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    return (
        <div
            key="kanban-view"
            className="flex gap-4 overflow-x-auto pb-4 custom-scroll cursor-grab active:cursor-grabbing select-none"
            ref={scrollContainerRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
        >
            {KANBAN_COLUMNS.map((column) => {
                const columnClients = getClientsByStatus(filteredClients, column.key);
                return (
                    <div
                        key={column.key}
                        className={cn(
                            'flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3 border-t-4 transition-all',
                            column.color,
                            draggedClient && 'border-dashed'
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => onDrop(e, column.key)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm">{column.label}</h3>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {columnClients.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scroll">
                            {columnClients.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                                    Arraste aqui
                                </div>
                            ) : (
                                columnClients.map((client) => (
                                    <div
                                        key={client.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.stopPropagation();
                                            onDragStart(e, client);
                                        }}
                                        onDragEnd={onDragEnd}
                                        onClick={() => onClientClick(client)}
                                        className={cn(
                                            'client-card w-full p-3 bg-background rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all text-left group cursor-grab active:cursor-grabbing',
                                            draggedClient?.id === client.id && 'opacity-50'
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-primary text-xs">{getInitials(client.name)}</span>
                                            </div>
                                            <div className="flex-1 min-h-0 relative">
                                                <p className="font-semibold text-sm truncate">{client.name || 'Sem nome'}</p>
                                                <p className="text-xs text-muted-foreground">{client.phone || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pl-6">
                                            {(client.cidade || client.bairro) && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                    📍 {client.cidade || ''}
                                                </p>
                                            )}
                                            {/* Score Badge */}
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                                                getLeadScore(client).bg,
                                                getLeadScore(client).color
                                            )} title={`Lead ${getLeadScore(client).label}`}>
                                                <span>{getLeadScore(client).icon}</span>
                                                <span>{getLeadScore(client).label}</span>
                                            </div>
                                        </div>

                                        {client.renda && (
                                            <p className="text-xs font-medium text-primary mt-1 pl-6">
                                                {formatCurrency(client.renda)}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
