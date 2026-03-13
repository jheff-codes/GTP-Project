import React from 'react';
import { BedDouble, Car, Maximize, MapPin, Edit3, Trash2 } from 'lucide-react';
import type { Imovel } from '../tipos';

interface CardImovelProps {
    imovel: Imovel;
    canEdit: boolean;
    canDelete: boolean;
    onView: (imovel: Imovel) => void;
    onEdit: (e: React.MouseEvent, imovel: Imovel) => void;
    onDelete: (e: React.MouseEvent, imovel: Imovel) => void;
}

const CardImovel: React.FC<CardImovelProps> = ({ imovel, canEdit, canDelete, onView, onEdit, onDelete }) => {
    const imageUrl = (() => {
        if (!imovel.midia_do_imovel) return 'https://placehold.co/600x400';
        try {
            const parsed = JSON.parse(imovel.midia_do_imovel);
            return Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
            return imovel.midia_do_imovel;
        }
    })();

    return (
        <div
            onClick={() => onView(imovel)}
            className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer flex flex-col"
        >
            {/* Image Section */}
            <div className="h-56 md:h-64 relative overflow-hidden bg-slate-100 dark:bg-black">
                <img
                    src={imageUrl}
                    alt={imovel.nome_do_imovel || ''}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Floating Price Badge */}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg border border-white/20 z-10">
                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300">Venda</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">R$ {imovel.preco}</span>
                </div>

                {/* Action Buttons Overlay */}
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 z-10">
                    {canEdit && (
                        <button onClick={(e) => onEdit(e, imovel)} className="p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-slate-800 dark:text-white hover:text-brand-500 shadow-lg">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={(e) => onDelete(e, imovel)} className="p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-slate-800 dark:text-white hover:text-red-500 shadow-lg">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Bottom Info in Image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-brand-500 text-black px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">{imovel.tipo_do_imovel}</span>
                        <span className="text-white/80 text-[10px] uppercase font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brand-500" /> {imovel.cidade}
                        </span>
                    </div>
                    <h4 className="text-white text-lg font-black leading-tight truncate">{imovel.nome_do_imovel}</h4>
                    <p className="text-slate-400 text-xs mt-1 truncate">{imovel.bairro}, {imovel.endereco}</p>
                </div>
            </div>

            {/* Details Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" title="Quartos">
                        <BedDouble className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{imovel.quartos || '-'}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-1.5" title="Vagas">
                        <Car className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{imovel.garagem || '-'}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-1.5" title="Área Privativa">
                        <Maximize className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{imovel.area_util ? imovel.area_util.replace('m²', '') : '-'} m²</span>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md uppercase">
                    Detalhes
                </div>
            </div>
        </div>
    );
};

export default CardImovel;
