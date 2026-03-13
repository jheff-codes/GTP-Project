import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/lib/database.types';
import type { Config } from '../hooks/useConfiguracoes';

interface DadosEmpresaProps {
    formData: {
        name: string;
        email: string;
        phone: string;
        address: string;
        creci: string;
        role: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<DadosEmpresaProps['formData']>>;
    config: Partial<Config>;
    setConfig: React.Dispatch<React.SetStateAction<Partial<Config>>>;
    loading: boolean;
    onSave: () => void;
    currentUser: Profile | null;
}

export function DadosEmpresa({ formData, setFormData, config, setConfig, loading, onSave, currentUser }: DadosEmpresaProps) {
    return (
        <div className="gtp-card">
            <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black">Dados da Imobiliária</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Nome da Empresa</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'imobiliaria' && (currentUser?.role as string) !== 'imob'}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Prefixo da Agência (Ex: MAP)</Label>
                    <Input
                        value={config.prefix || ''}
                        onChange={e => setConfig(prev => ({ ...prev, prefix: e.target.value }))}
                        placeholder="MAP"
                    />
                    <p className="text-[10px] text-muted-foreground">Usado para identificar corretores desta agência.</p>
                </div>
                <div className="space-y-2">
                    <Label>CRECI</Label>
                    <Input
                        value={formData.creci}
                        onChange={e => setFormData({ ...formData, creci: e.target.value })}
                        placeholder="00000-J"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Endereço</Label>
                    <Input
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua Exemplo, 123"
                    />
                </div>
            </div>
            <Button className="mt-6" onClick={onSave} disabled={loading}>Salvar Dados</Button>
        </div>
    );
}
