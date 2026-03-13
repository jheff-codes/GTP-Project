import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AlterarSenhaProps {
    passwordForm: {
        current: string;
        new: string;
        confirm: string;
    };
    setPasswordForm: React.Dispatch<React.SetStateAction<AlterarSenhaProps['passwordForm']>>;
    onSave: () => void;
}

export function AlterarSenha({ passwordForm, setPasswordForm, onSave }: AlterarSenhaProps) {
    return (
        <div className="gtp-card">
            <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black">Alterar Senha</h2>
            </div>
            <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                </div>
                <Button variant="outline" onClick={onSave}>Atualizar Senha</Button>
            </div>
        </div>
    );
}
