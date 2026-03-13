import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, MapPin, DollarSign, Home, BedDouble, Search } from 'lucide-react';
import { CITIES, PROPERTY_TYPES } from '../utils/constantes';
import type { FiltrosImoveis } from '../tipos';

interface FiltrosDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FiltrosImoveis;
    setFilters: React.Dispatch<React.SetStateAction<FiltrosImoveis>>;
    onApply: () => void;
    onClear: () => void;
}

const FiltrosDropdown: React.FC<FiltrosDropdownProps> = ({
    isOpen, onClose, filters, setFilters, onApply, onClear,
}) => {
    const [openSection, setOpenSection] = useState<string | null>('search');

    if (!isOpen) return null;

    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        const amount = parseFloat(digits) / 100;
        return amount.toLocaleString('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const formatted = formatCurrency(value);
        setFilters((prev) => ({ ...prev, [name]: formatted }));
    };

    const toggleSection = (sec: string) => setOpenSection(openSection === sec ? null : sec);

    const inputStyles = 'w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 outline-none focus:ring-2 ring-brand-500/50 transition-all';

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Home className="w-4 h-4 text-brand-500" /> Filtros de Imóveis
                </h4>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-y-auto custom-scroll flex-1 p-4 space-y-3">

                {/* BUSCA POR NOME */}
                <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
                    <button onClick={() => toggleSection('search')} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><Search className="w-3 h-3" /> Identificação</span>
                        {openSection === 'search' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openSection === 'search' && (
                        <div className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Imóvel</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    name="nome"
                                    value={filters.nome}
                                    onChange={handleChange}
                                    placeholder="Buscar por nome..."
                                    className={`${inputStyles} pl-8`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* LOCALIZAÇÃO */}
                <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
                    <button onClick={() => toggleSection('location')} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><MapPin className="w-3 h-3" /> Localização</span>
                        {openSection === 'location' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openSection === 'location' && (
                        <div className="p-3 space-y-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                                <select name="cidade" value={filters.cidade} onChange={handleChange} className={inputStyles}>
                                    <option value="">Todas as Cidades</option>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* VALORES DE VENDA */}
                <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
                    <button onClick={() => toggleSection('values_sale')} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Valor de Venda</span>
                        {openSection === 'values_sale' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openSection === 'values_sale' && (
                        <div className="p-3 space-y-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínimo</label>
                                    <input type="text" name="minPreco" value={filters.minPreco} onChange={handleCurrencyChange} placeholder="0,00" className={inputStyles} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máximo</label>
                                    <input type="text" name="maxPreco" value={filters.maxPreco} onChange={handleCurrencyChange} placeholder="0,00" className={inputStyles} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* VALORES DE RENDA */}
                <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
                    <button onClick={() => toggleSection('values_income')} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Renda Sugerida</span>
                        {openSection === 'values_income' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openSection === 'values_income' && (
                        <div className="p-3 space-y-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínimo</label>
                                    <input type="text" name="minRenda" value={filters.minRenda} onChange={handleCurrencyChange} placeholder="0,00" className={inputStyles} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máximo</label>
                                    <input type="text" name="maxRenda" value={filters.maxRenda} onChange={handleCurrencyChange} placeholder="0,00" className={inputStyles} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CARACTERISTICAS */}
                <div className="border rounded-xl dark:border-slate-700 overflow-hidden">
                    <button onClick={() => toggleSection('features')} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><BedDouble className="w-3 h-3" /> Características</span>
                        {openSection === 'features' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openSection === 'features' && (
                        <div className="p-3 space-y-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Imóvel</label>
                                <select name="tipo" value={filters.tipo} onChange={handleChange} className={inputStyles}>
                                    <option value="">Todos os Tipos</option>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mín. Quartos</label>
                                    <input type="number" name="minQuartos" value={filters.minQuartos} onChange={handleChange} placeholder="0" className={inputStyles} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mín. M²</label>
                                    <input type="number" name="minArea" value={filters.minArea} onChange={handleChange} placeholder="0" className={inputStyles} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t dark:border-slate-700 flex gap-2 bg-slate-50 dark:bg-slate-900/50">
                <button onClick={onClear} className="flex-1 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Limpar</button>
                <button onClick={onApply} className="flex-1 py-2 text-sm font-bold bg-brand-500 text-black rounded-xl hover:bg-brand-400 transition-colors shadow-lg">Aplicar</button>
            </div>
        </div>
    );
};

export default FiltrosDropdown;
