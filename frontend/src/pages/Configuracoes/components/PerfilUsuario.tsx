import { User, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/lib/database.types';

interface PerfilUsuarioProps {
    formData: {
        name: string;
        email: string;
        phone: string;
        address: string;
        creci: string;
        role: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<PerfilUsuarioProps['formData']>>;
    currentUser: Profile | null;
    loading: boolean;
    onSave: () => void;
    isImobiliaria: boolean;
    onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PerfilUsuario({ formData, setFormData, currentUser, loading, onSave, isImobiliaria, onAvatarChange }: PerfilUsuarioProps) {
    return (
        <div className="gtp-card">
            <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black">Seu Perfil</h2>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer w-24 h-24">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-background shadow-xl">
                        {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <User className="w-10 h-10 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={onAvatarChange}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Clique para alterar foto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isImobiliaria && (
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="bg-muted opacity-80"
                    />
                    {currentUser?.role === 'admin' && <p className="text-[10px] text-muted-foreground">Para alterar email, contate o suporte técnico.</p>}
                </div>
                <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                        value={currentUser?.label || currentUser?.role || ''}
                        disabled
                        className="bg-muted opacity-80"
                    />
                </div>
            </div>

            <Button className="mt-6" onClick={onSave} disabled={loading}>
                Atualizar Perfil
            </Button>
        </div>
    );
}
