import { Plus, Users, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderEquipeProps {
    viewMode: 'team' | 'queue';
    setViewMode: (v: 'team' | 'queue') => void;
    onAddMember: () => void;
}

export const HeaderEquipe = ({ viewMode, setViewMode, onAddMember }: HeaderEquipeProps) => {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/20">
                        <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Gestão de Equipes</h1>
                        <p className="text-muted-foreground text-sm">{viewMode === 'team' ? 'Visão Hierárquica' : 'Fila de Atendimento'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-background/50 rounded-xl p-1 border border-border/50">
                        <Button variant={viewMode === 'team' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('team')} className={cn("gap-2 rounded-lg", viewMode === 'team' && "bg-purple-500 text-white hover:bg-purple-600")}>
                            <Users className="w-4 h-4" /> Equipe
                        </Button>
                        <Button variant={viewMode === 'queue' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('queue')} className={cn("gap-2 rounded-lg", viewMode === 'queue' && "bg-purple-500 text-white hover:bg-purple-600")}>
                            <ListIcon className="w-4 h-4" /> Fila
                        </Button>
                    </div>
                    <Button onClick={onAddMember} className="gap-2 font-bold uppercase tracking-wider bg-purple-500 hover:bg-purple-600 rounded-xl shadow-lg">
                        <Plus className="w-4 h-4" /> Novo Membro
                    </Button>
                </div>
            </div>
        </div>
    );
};
