import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ROLE_CATEGORIES } from '../constantes';

interface LoginFormProps {
    selectedCategory: string;
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: (v: boolean) => void;
    isLoading: boolean;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
}

export const LoginForm = ({
    selectedCategory,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    onSubmit,
    onBack,
}: LoginFormProps) => {
    const category = ROLE_CATEGORIES.find(c => c.id === selectedCategory);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col items-center">
                {category && (
                    <>
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl",
                            category.id === 'admin' ? "bg-purple-500 text-white" :
                                category.id === 'management' ? "bg-blue-500 text-white" :
                                    "bg-emerald-500 text-white"
                        )}>
                            <category.icon className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">{category.title}</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-6 py-1.5 rounded-full bg-white/5">
                            Credenciais de acesso
                        </p>
                    </>
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase animate-shake">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email</Label>
                    <div className="relative group">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="h-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-700 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Senha</Label>
                    <div className="relative group">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="h-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-700 transition-all pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-500 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-2 space-y-3">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="w-full h-12 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft className="w-3 h-3 mr-2" />
                        Voltar
                    </Button>
                </div>
            </form>
        </div>
    );
};
