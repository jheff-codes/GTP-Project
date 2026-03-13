import React, { useEffect, useState } from 'react';
import { X, BedDouble, Bath, Maximize, MapPin, Building2, Calendar, Wallet, Ruler, FileText, ExternalLink, CheckCircle2, Banknote } from 'lucide-react';
import { InfoCard, RuleItem } from './BadgeCaracteristica';
import type { Imovel } from '../tipos';

interface ModalDetalhesImovelProps {
    isOpen: boolean;
    onClose: () => void;
    property: Imovel | null;
}

const ModalDetalhesImovel: React.FC<ModalDetalhesImovelProps> = ({ isOpen, onClose, property }) => {
    const [isBackdropDown, setIsBackdropDown] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) setIsBackdropDown(true);
    };

    const handleMouseUp = () => {
        if (isBackdropDown) onClose();
        setIsBackdropDown(false);
    };

    if (!isOpen || !property) return null;

    const mediaList = (() => {
        if (!property.midia_do_imovel) return [];
        try {
            const parsed = JSON.parse(property.midia_do_imovel);
            return Array.isArray(parsed) ? parsed : [property.midia_do_imovel];
        } catch { return [property.midia_do_imovel]; }
    })();

    const displayImage = mediaList[0] || 'https://placehold.co/1200x800/0a0a0a/10b981?text=Sem+Imagem';

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <div className="bg-white dark:bg-slate-800 w-full max-w-7xl h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/5 animate-in zoom-in-95 duration-300" onMouseDown={(e) => e.stopPropagation()}>

                {/* Lado Esquerdo - Imagem e Cabeçalho */}
                <div className="lg:w-5/12 relative bg-black flex flex-col group">
                    <div className="relative flex-1 overflow-hidden">
                        <img
                            src={displayImage}
                            alt={property.nome_do_imovel || ''}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800/0a0a0a/10b981?text=Erro+ao+Carregar'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-10">
                            <div className="flex gap-2 mb-4">
                                <span className="bg-brand-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {property.tipo_do_imovel}
                                </span>
                                <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {property.cidade}
                                </span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter drop-shadow-2xl mb-2 leading-tight">
                                {property.nome_do_imovel}
                            </h2>
                            <p className="text-slate-300 font-bold flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-brand-500" /> {property.bairro}, {property.endereco}
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} className="absolute top-6 left-6 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors border border-white/10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Lado Direito - Informações Scrolláveis */}
                <div className="lg:w-7/12 flex flex-col bg-white dark:bg-[#0a0a0a] overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scroll p-8 lg:p-10 space-y-10">

                        {/* 1. Botões de Ação Rápida */}
                        <div className="flex flex-wrap gap-4">
                            {property.link_pdf && (
                                <a href={property.link_pdf} target="_blank" rel="noreferrer" className="flex-1 min-w-[200px] bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                                    <div className="p-2 bg-white dark:bg-red-900/30 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><FileText className="w-5 h-5" /></div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Apresentação</p>
                                        <p className="font-bold text-sm">Abrir PDF do Produto</p>
                                    </div>
                                </a>
                            )}
                            {property.link_drive && (
                                <a href={property.link_drive} target="_blank" rel="noreferrer" className="flex-1 min-w-[200px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                                    <div className="p-2 bg-white dark:bg-blue-900/30 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><ExternalLink className="w-5 h-5" /></div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Material de Venda</p>
                                        <p className="font-bold text-sm">Drive / CRM Construtora</p>
                                    </div>
                                </a>
                            )}
                        </div>

                        {/* 2. Resumo e Especificações Técnicas */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-brand-500" /> Especificação Técnica
                            </h3>

                            {property.resumo && (
                                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                        "{property.resumo}"
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InfoCard icon={BedDouble} label="Tipologias" value={property.tipologia || property.quartos + ' Quartos'} color="text-blue-500" highlight />
                                <InfoCard icon={Ruler} label="Área Privativa" value={property.area_util ? (property.area_util.includes('m') ? property.area_util : `${property.area_util} m²`) : '-'} color="text-indigo-500" />
                                <InfoCard icon={Bath} label="Banheiros" value={property.banheiros} color="text-cyan-500" />
                                <InfoCard icon={Building2} label="Vagas / Unid." value={property.garagem} color="text-slate-500" />
                                <InfoCard icon={Calendar} label="Entrega" value={property.data_entrega} color="text-amber-500" />
                                <InfoCard icon={Wallet} label="Renda Sugerida" value={`R$ ${property.renda}`} color="text-emerald-500" />
                            </div>
                        </div>

                        {/* 3. Regras Comerciais */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/5 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Banknote className="w-32 h-32 text-emerald-600" />
                            </div>

                            <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight mb-6 flex items-center gap-2 relative z-10">
                                <CheckCircle2 className="w-6 h-6" /> Regras Comerciais & Pagamento
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                                <RuleItem label="Sinal Mínimo" value={property.sinal_minimo} />
                                <RuleItem label="Entrada Parcelada" value={property.entrada_parcelamento} />
                                <RuleItem label="Balões / Intermediárias" value={property.regra_balao} />
                                <RuleItem label="Pós-Chaves" value={property.pos_chaves} />
                                <RuleItem label="Documentação (ITBI/Registro)" value={property.regra_documentacao} />
                                <RuleItem label="Pagamento da Doc." value={property.pagamento_documentacao} />
                                <RuleItem label="Casa Fácil / Cohapar" value={property.programa_governo} />
                                <RuleItem label="Taxa de Abertura (TAC)" value={property.taxa_abertura} />
                            </div>
                        </div>

                        {/* 4. Descrição Completa */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                                <FileText className="w-4 h-4 text-slate-500" /> Memorial Descritivo
                            </h4>
                            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">
                                    {property.descricao || 'Nenhuma descrição detalhada disponível para este imóvel.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Fixo */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex justify-between items-center flex-shrink-0 z-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor de Venda (A partir de)</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">R$ {property.preco || 'Sob Consulta'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalhesImovel;
