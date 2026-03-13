import { useState, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, MapPin, Bed, Bath, Car, Maximize, MoreVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImoveis } from '@/hooks/useImoveis';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import ModalDetalhesImovel from './components/ModalDetalhesImovel';
import type { Imovel } from './tipos';
import React from 'react';

const ModalCadastroImovel = React.lazy(() => import('./components/ModalCadastroImovel'));

const propertyTypeConfig: Record<string, { label: string }> = {
    apartamento: { label: 'Apartamento' },
    casa: { label: 'Casa' },
    terreno: { label: 'Terreno' },
    comercial: { label: 'Comercial' },
    rural: { label: 'Rural' },
};

const Imoveis = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const { data: imoveis, isLoading, error } = useImoveis();
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    const [searchParams] = useSearchParams();
    const idParam = searchParams.get('id');

    const [editingProperty, setEditingProperty] = useState<Imovel | null>(null);
    const [viewingProperty, setViewingProperty] = useState<Imovel | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredProperties = imoveis?.filter((property) => {
        if (idParam) return property.id === Number(idParam);
        const matchesSearch =
            property.nome_do_imovel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || property.tipo_do_imovel === typeFilter;
        return matchesSearch && matchesType;
    }) || [];

    const formatCurrency = (value: string | null) => {
        if (!value) return 'R$ 0';
        const num = parseFloat(value);
        if (isNaN(num)) return 'R$ 0';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const hasPermission = (section: string, action: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        const sectionPerms = currentUser.parsedPermissions[section as keyof typeof currentUser.parsedPermissions];
        if (!sectionPerms) return false;
        return (sectionPerms as Record<string, boolean>)[action] === true;
    };

    const canView = hasPermission('properties', 'view');
    const canAdd = hasPermission('properties', 'add');
    const canEdit = hasPermission('properties', 'edit');
    const canDelete = hasPermission('properties', 'delete');
    const canUseFilters = hasPermission('properties', 'use_filters');

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['imoveis'] });

    const handleOpenEdit = (prop: Imovel) => {
        if (!canEdit) return;
        setEditingProperty(prop);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (prop: Imovel) => {
        if (!canDelete) return;
        try {
            const { error } = await supabase.from('imoveis').delete().eq('id', prop.id);
            if (error) throw error;
            toast({ title: 'Imóvel removido.', variant: 'default' });
            invalidate();
        } catch {
            toast({ title: 'Erro ao excluir.', variant: 'destructive' });
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-semibold">Erro ao carregar imóveis</p>
                <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground">Você não tem permissão para visualizar imóveis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Modais */}
            <Suspense fallback={null}>
                {isAddModalOpen && (
                    <ModalCadastroImovel
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); setEditingProperty(null); }}
                        onSuccess={invalidate}
                        initialData={editingProperty}
                    />
                )}
            </Suspense>
            <ModalDetalhesImovel
                isOpen={!!viewingProperty}
                onClose={() => setViewingProperty(null)}
                property={viewingProperty}
            />

            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/20 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-orange-500/20">
                            <MapPin className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Imóveis</h1>
                            <p className="text-muted-foreground text-sm">Catálogo completo de imóveis ({imoveis?.length || 0})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 rounded-xl bg-background/50 border-white/10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px] h-10 rounded-xl bg-background/50 border-white/10">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.entries(propertyTypeConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {canAdd && (
                            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary rounded-xl shadow-lg font-bold text-xs uppercase tracking-widest px-6 h-10">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Imóvel
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredProperties.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 gtp-card">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Maximize className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold">Nenhum imóvel cadastrado</p>
                    <p className="text-muted-foreground text-center max-w-md">
                        Comece adicionando imóveis ao catálogo clicando no botão "Novo Imóvel" acima.
                    </p>
                    {canAdd && (
                        <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Primeiro Imóvel
                        </Button>
                    )}
                </div>
            )}

            {/* Properties Grid */}
            {filteredProperties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                        <div
                            key={property.id}
                            className="gtp-card group hover:scale-[1.02] overflow-hidden p-0 cursor-pointer"
                            onClick={() => setViewingProperty(property)}
                        >
                            {/* Image Placeholder */}
                            <div className="h-48 bg-muted relative">
                                {property.midia_do_imovel ? (
                                    <img
                                        src={(() => {
                                            try {
                                                const parsed = JSON.parse(property.midia_do_imovel);
                                                return Array.isArray(parsed) ? parsed[0] : parsed;
                                            } catch {
                                                return property.midia_do_imovel;
                                            }
                                        })()}
                                        alt={property.nome_do_imovel || ''}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-muted-foreground">
                                            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                                <Maximize className="w-8 h-8" />
                                            </div>
                                            <span className="text-sm">Sem imagem</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-success text-success-foreground">
                                        Disponível
                                    </span>
                                    {property.tipo_do_imovel && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
                                            {propertyTypeConfig[property.tipo_do_imovel]?.label || property.tipo_do_imovel}
                                        </span>
                                    )}
                                </div>
                                {(canEdit || canDelete) && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute top-4 right-4 h-8 w-8 rounded-lg"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            {canEdit && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(property); }}>Editar</DropdownMenuItem>}
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingProperty(property); }}>Ver Detalhes</DropdownMenuItem>
                                            {canDelete && <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(property); }}>Excluir</DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-lg font-black tracking-tight mb-2 line-clamp-1">
                                    {property.nome_do_imovel || 'Imóvel sem nome'}
                                </h3>

                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate">
                                        {property.bairro || 'Bairro'}, {property.cidade || 'Cidade'}
                                    </span>
                                </div>

                                {/* Features */}
                                <div className="flex items-center gap-4 mb-4">
                                    {property.quartos && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Bed className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{property.quartos}</span>
                                        </div>
                                    )}
                                    {property.banheiros && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Bath className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{property.banheiros}</span>
                                        </div>
                                    )}
                                    {property.garagem && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Car className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{property.garagem}</span>
                                        </div>
                                    )}
                                    {property.area_util && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Maximize className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{property.area_util}m²</span>
                                        </div>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="pt-4 border-t border-border">
                                    <span className="micro-label">Valor</span>
                                    <p className="text-2xl font-black text-primary">
                                        {formatCurrency(property.preco)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Imoveis;
