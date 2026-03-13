import { Settings as SettingsIcon } from 'lucide-react';

export function HeaderConfiguracoes() {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-500/20 via-slate-500/10 to-transparent border border-slate-500/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-500/20">
                    <SettingsIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Configurações</h1>
                    <p className="text-muted-foreground text-sm">Gerencie seu perfil e preferências</p>
                </div>
            </div>
        </div>
    );
}
