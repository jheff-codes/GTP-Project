import { cn } from '@/lib/utils';
import { ROLE_CATEGORIES } from '../constantes';

interface CategorySelectorProps {
    onSelectCategory: (categoryId: string) => void;
}

export const CategorySelector = ({ onSelectCategory }: CategorySelectorProps) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-xl font-black text-white uppercase tracking-[0.15em] mb-2">
                    Acesso ao Sistema
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Selecione seu perfil para continuar
                </p>
            </div>

            <div className="space-y-4">
                {ROLE_CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className="w-full group flex items-center gap-5 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                            category.id === 'admin' ? "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white" :
                                category.id === 'management' ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white" :
                                    "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                        )}>
                            <category.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-black text-[#f8fafc] uppercase tracking-wider mb-0.5">
                                {category.title}
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">
                                {category.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
