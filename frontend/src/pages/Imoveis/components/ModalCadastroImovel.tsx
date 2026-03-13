import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Building2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CITIES, NEIGHBORHOODS, PROPERTY_TYPES } from '../utils/constantes';
import { MapPin, Ruler, Banknote, Link, FileText, CalendarClock, Briefcase, CheckCircle2 } from 'lucide-react';
import type { Imovel } from '../tipos';

interface ModalCadastroImovelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Imovel | null;
}

const ModalCadastroImovel: React.FC<ModalCadastroImovelProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { data: currentUser } = useCurrentUser();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome_do_imovel: '',
        tipo_do_imovel: 'Apartamento',
        descricao: '',
        resumo: '',
        preco: '',
        area_util: '',
        quartos: '',
        tipologia: '',
        banheiros: '',
        suites: '',
        garagem: '',
        pais: 'Brasil',
        estado: 'Paraná',
        cidade: '',
        bairro: '',
        endereco: '',
        construtoras: '',
        renda: '',
        data_entrega: '',
        link_pdf: '',
        link_drive: '',
        sinal_minimo: '',
        entrada_parcelamento: '',
        regra_balao: '',
        pos_chaves: '',
        regra_documentacao: '',
        pagamento_documentacao: '',
        programa_governo: '',
        taxa_abertura: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [existingMedia, setExistingMedia] = useState<string | null>(null);
    const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<string[]>([]);
    const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false);
    const neighborhoodInputRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialData) {
                setFormData({
                    nome_do_imovel: initialData.nome_do_imovel || '',
                    tipo_do_imovel: initialData.tipo_do_imovel || 'Apartamento',
                    descricao: initialData.descricao || '',
                    resumo: initialData.resumo || '',
                    preco: initialData.preco || '',
                    area_util: initialData.area_util || '',
                    quartos: initialData.quartos ? String(initialData.quartos) : '',
                    tipologia: initialData.tipologia || '',
                    banheiros: initialData.banheiros || '',
                    suites: initialData.suites || '',
                    garagem: initialData.garagem || '',
                    pais: initialData.pais || 'Brasil',
                    estado: initialData.estado || 'Paraná',
                    cidade: initialData.cidade || '',
                    bairro: initialData.bairro || '',
                    endereco: initialData.endereco || '',
                    construtoras: initialData.construtoras || '',
                    renda: initialData.renda || '',
                    data_entrega: initialData.data_entrega || '',
                    link_pdf: initialData.link_pdf || '',
                    link_drive: initialData.link_drive || '',
                    sinal_minimo: initialData.sinal_minimo || '',
                    entrada_parcelamento: initialData.entrada_parcelamento || '',
                    regra_balao: initialData.regra_balao || '',
                    pos_chaves: initialData.pos_chaves || '',
                    regra_documentacao: initialData.regra_documentacao || '',
                    pagamento_documentacao: initialData.pagamento_documentacao || '',
                    programa_governo: initialData.programa_governo || '',
                    taxa_abertura: initialData.taxa_abertura || '',
                    latitude: initialData.latitude || null,
                    longitude: initialData.longitude || null,
                });
                if (initialData.midia_do_imovel) {
                    try {
                        const parsed = JSON.parse(initialData.midia_do_imovel);
                        setExistingMedia(Array.isArray(parsed) ? parsed[0] : parsed);
                    } catch { setExistingMedia(initialData.midia_do_imovel); }
                } else setExistingMedia(null);
                setSelectedFile(null);
            } else {
                setFormData({
                    nome_do_imovel: '', tipo_do_imovel: 'Apartamento', descricao: '', resumo: '', preco: '',
                    area_util: '', quartos: '', tipologia: '', banheiros: '', suites: '', garagem: '',
                    pais: 'Brasil', estado: 'Paraná', cidade: '', bairro: '', endereco: '', construtoras: '',
                    renda: '', data_entrega: '', link_pdf: '', link_drive: '', sinal_minimo: '',
                    entrada_parcelamento: '', regra_balao: '', pos_chaves: '', regra_documentacao: '',
                    pagamento_documentacao: '', programa_governo: '', taxa_abertura: '',
                    latitude: null, longitude: null,
                });
                setSelectedFile(null);
                setExistingMedia(null);
            }
        }
    }, [isOpen, initialData]);

    // CRITICAL: Filtro dinâmico de bairros usando constantes centralizadas
    useEffect(() => {
        if (formData.cidade && NEIGHBORHOODS[formData.cidade]) {
            const search = formData.bairro.toLowerCase();
            setFilteredNeighborhoods(NEIGHBORHOODS[formData.cidade].filter(b => b.toLowerCase().includes(search)));
        } else setFilteredNeighborhoods([]);
    }, [formData.cidade, formData.bairro]);

    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        return (parseFloat(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        if (name === 'preco' || name === 'renda') setFormData(prev => ({ ...prev, [name]: formatCurrency(value) }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nErr: Record<string, boolean> = {};
        if (!formData.nome_do_imovel) nErr.nome_do_imovel = true;
        if (!formData.cidade) nErr.cidade = true;
        if (!formData.bairro) nErr.bairro = true;
        if (Object.keys(nErr).length > 0) { setErrors(nErr); return; }

        setIsLoading(true);
        try {
            let mediaUrl = existingMedia;

            // CRITICAL: Upload para Supabase Storage (Midia_Imoveis)
            if (selectedFile) {
                const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const { error: upErr } = await supabase.storage.from('Midia_Imoveis').upload(`imoveis/${fileName}`, selectedFile);
                if (upErr) throw upErr;
                mediaUrl = supabase.storage.from('Midia_Imoveis').getPublicUrl(`imoveis/${fileName}`).data.publicUrl;
            }

            const payload = {
                ...formData,
                midia_do_imovel: mediaUrl ? JSON.stringify([mediaUrl]) : null,
                quartos: formData.quartos || null,
                // CRITICAL: Salva o prefixo da imobiliária
                prefix: currentUser?.prefix,
            };

            const { error } = initialData?.id
                ? await supabase.from('imoveis').update(payload).eq('id', initialData.id)
                : await supabase.from('imoveis').insert(payload);

            if (error) throw error;
            onSuccess(); onClose();
        } catch (error) { console.error(error); alert('Erro ao salvar.'); } finally { setIsLoading(false); }
    };

    if (!isOpen) return null;
    const inputClass = (f: string) => `w-full p-2.5 bg-slate-50 dark:bg-slate-700 border ${errors[f] ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-600'} rounded-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all`;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-0 md:p-4"
            onClick={onClose}
        >
            <div className="bg-white dark:bg-slate-800 w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Building2 className="w-5 h-5" /> {initialData ? 'Editar Imóvel' : 'Novo Imóvel'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scroll p-6 space-y-8">

                    {/* ═══ 1. INFORMAÇÕES BÁSICAS ═══ */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" /> Informações Básicas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nome do Empreendimento *</label>
                                <input type="text" name="nome_do_imovel" value={formData.nome_do_imovel} onChange={handleChange} className={inputClass('nome_do_imovel')} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tipo de Imóvel</label>
                                <select name="tipo_do_imovel" value={formData.tipo_do_imovel} onChange={handleChange} className={inputClass('tipo_do_imovel')}>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Resumo Curto</label>
                                <input type="text" name="resumo" value={formData.resumo} onChange={handleChange} className={inputClass('resumo')} placeholder="Ex: Apartamento 2Q com varanda gourmet" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Descrição Completa</label>
                                <textarea name="descricao" value={formData.descricao} onChange={handleChange} className={`${inputClass('descricao')} h-32 resize-none`} placeholder="Memorial descritivo do empreendimento..." />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 2. LOCALIZAÇÃO ═══ */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500" /> Localização
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cidade *</label>
                                <select name="cidade" value={formData.cidade} onChange={handleChange} className={inputClass('cidade')}>
                                    <option value="">Selecione...</option>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Bairro *</label>
                                <input
                                    type="text"
                                    name="bairro"
                                    ref={neighborhoodInputRef}
                                    value={formData.bairro}
                                    onChange={(e) => { handleChange(e); setShowNeighborhoodDropdown(true); }}
                                    className={inputClass('bairro')}
                                    autoComplete="off"
                                />
                                {showNeighborhoodDropdown && filteredNeighborhoods.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
                                        {filteredNeighborhoods.map(b => (
                                            <div key={b} onClick={() => { setFormData(p => ({ ...p, bairro: b })); setShowNeighborhoodDropdown(false); }} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs">
                                                {b}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Endereço Completo</label>
                                <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputClass('endereco')} placeholder="Rua, número, complemento" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 3. VALORES ═══ */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                        <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Banknote className="w-4 h-4" /> Valores
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Preço de Venda</label>
                                <input type="text" name="preco" value={formData.preco} onChange={handleChange} className={inputClass('preco')} placeholder="R$ 0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Renda Sugerida</label>
                                <input type="text" name="renda" value={formData.renda} onChange={handleChange} className={inputClass('renda')} placeholder="R$ 0,00" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 4. CARACTERÍSTICAS TÉCNICAS ═══ */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-indigo-500" /> Características Técnicas
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Quartos</label>
                                <input type="text" name="quartos" value={formData.quartos} onChange={handleChange} className={inputClass('quartos')} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Suítes</label>
                                <input type="text" name="suites" value={formData.suites} onChange={handleChange} className={inputClass('suites')} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Banheiros</label>
                                <input type="text" name="banheiros" value={formData.banheiros} onChange={handleChange} className={inputClass('banheiros')} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Vagas Garagem</label>
                                <input type="text" name="garagem" value={formData.garagem} onChange={handleChange} className={inputClass('garagem')} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Área Útil</label>
                                <input type="text" name="area_util" value={formData.area_util} onChange={handleChange} className={inputClass('area_util')} placeholder="Ex: 50m²" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tipologia</label>
                                <input type="text" name="tipologia" value={formData.tipologia} onChange={handleChange} className={inputClass('tipologia')} placeholder="Ex: 2Q, 3Q" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Data de Entrega</label>
                                <input type="text" name="data_entrega" value={formData.data_entrega} onChange={handleChange} className={inputClass('data_entrega')} placeholder="Ex: Dez/2026" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Construtora</label>
                                <input type="text" name="construtoras" value={formData.construtoras} onChange={handleChange} className={inputClass('construtoras')} placeholder="Nome da construtora" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 5. REGRAS COMERCIAIS & PAGAMENTO ═══ */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/5 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Banknote className="w-24 h-24 text-emerald-600" />
                        </div>
                        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                            <CheckCircle2 className="w-4 h-4" /> Regras Comerciais & Pagamento
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Sinal Mínimo</label>
                                <input type="text" name="sinal_minimo" value={formData.sinal_minimo} onChange={handleChange} className={inputClass('sinal_minimo')} placeholder="Ex: R$ 500,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Entrada Parcelamento</label>
                                <input type="text" name="entrada_parcelamento" value={formData.entrada_parcelamento} onChange={handleChange} className={inputClass('entrada_parcelamento')} placeholder="Ex: 60x sem juros" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Balão / Intermediárias</label>
                                <input type="text" name="regra_balao" value={formData.regra_balao} onChange={handleChange} className={inputClass('regra_balao')} placeholder="Ex: Sem balão" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Pós-Chaves</label>
                                <input type="text" name="pos_chaves" value={formData.pos_chaves} onChange={handleChange} className={inputClass('pos_chaves')} placeholder="Condições pós-chaves" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Documentação (ITBI/Registro)</label>
                                <input type="text" name="regra_documentacao" value={formData.regra_documentacao} onChange={handleChange} className={inputClass('regra_documentacao')} placeholder="Regras de documentação" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Pagamento da Doc.</label>
                                <input type="text" name="pagamento_documentacao" value={formData.pagamento_documentacao} onChange={handleChange} className={inputClass('pagamento_documentacao')} placeholder="Ex: À vista / Parcelado" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Casa Fácil / Cohapar</label>
                                <input type="text" name="programa_governo" value={formData.programa_governo} onChange={handleChange} className={inputClass('programa_governo')} placeholder="Programa do governo" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 block">Taxa de Abertura (TAC)</label>
                                <input type="text" name="taxa_abertura" value={formData.taxa_abertura} onChange={handleChange} className={inputClass('taxa_abertura')} placeholder="Valor da TAC" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 6. MÍDIA E LINKS ═══ */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-pink-500" /> Mídia e Links
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Foto do Imóvel</label>
                                <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-slate-300 dark:border-slate-600 relative h-48 flex items-center justify-center">
                                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    {selectedFile || existingMedia ? (
                                        <img src={selectedFile ? URL.createObjectURL(selectedFile) : (existingMedia || '')} className="h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400"><ImageIcon className="w-8 h-8" /><span>Upload de imagem única</span></div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Link PDF (Apresentação)</label>
                                    <input type="url" name="link_pdf" value={formData.link_pdf} onChange={handleChange} className={inputClass('link_pdf')} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Link Drive (Material de Venda)</label>
                                    <input type="url" name="link_drive" value={formData.link_drive} onChange={handleChange} className={inputClass('link_drive')} placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
                <div className="p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 pb-safe">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Imóvel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCadastroImovel;
