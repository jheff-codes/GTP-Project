import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle2, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface Contato {
    name: string;
    phone: string;
    stats: string;
}

interface UploadContatosProps {
    onParsed: (contatos: Contato[]) => void;
    onClear: () => void;
}

const REQUIRED_FIELDS = ['name', 'phone'] as const;
const STATS_FIELD = 'stats';
const DEFAULT_STATS = 'aguardando';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.tsv', '.txt'];
const ACCEPT_STRING = ACCEPTED_EXTENSIONS.join(',');

type DetectedFormat = 'CSV' | 'XLSX' | 'XLS' | 'TSV' | 'TXT';

function detectSeparator(headerLine: string): string {
    const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
    for (const char of headerLine) {
        if (char in counts) counts[char]++;
    }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : ',';
}

function normalizeHeader(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

function getExtension(filename: string): string {
    return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

function parseTextContent(text: string): Contato[] | string {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return 'Arquivo deve ter pelo menos 1 contato além do cabeçalho.';

    const separator = detectSeparator(lines[0]);
    const headers = lines[0].split(separator).map(normalizeHeader);

    const nameIdx = headers.indexOf('name');
    const phoneIdx = headers.indexOf('phone');
    const statsIdx = headers.indexOf('stats');

    if (nameIdx === -1 || phoneIdx === -1) {
        return `Colunas obrigatórias não encontradas. Necessário: name, phone. Encontrado: "${lines[0]}" (separador detectado: "${separator === '\t' ? 'TAB' : separator}")`;
    }

    const contatos: Contato[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator).map(c => c.trim());
        const name = cols[nameIdx] || '';
        const phone = cols[phoneIdx] || '';
        if (!name && !phone) continue;

        contatos.push({
            name,
            phone,
            stats: statsIdx !== -1 && cols[statsIdx] ? cols[statsIdx] : DEFAULT_STATS,
        });
    }

    return contatos.length > 0 ? contatos : 'Nenhum contato válido encontrado no arquivo.';
}

function parseExcelContent(data: ArrayBuffer): Contato[] | string {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return 'Planilha vazia — nenhuma aba encontrada.';

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length === 0) return 'Planilha sem dados — apenas cabeçalho ou vazia.';

    const rawHeaders = Object.keys(rows[0]);
    const headerMap = new Map<string, string>();
    for (const h of rawHeaders) {
        headerMap.set(normalizeHeader(h), h);
    }

    const nameKey = headerMap.get('name');
    const phoneKey = headerMap.get('phone');
    const statsKey = headerMap.get('stats');

    if (!nameKey || !phoneKey) {
        return `Colunas obrigatórias não encontradas. Necessário: name, phone. Encontrado: ${rawHeaders.join(', ')}`;
    }

    const contatos: Contato[] = [];
    for (const row of rows) {
        const name = String(row[nameKey] || '').trim();
        const phone = String(row[phoneKey] || '').trim();
        if (!name && !phone) continue;

        contatos.push({
            name,
            phone,
            stats: statsKey && row[statsKey] ? String(row[statsKey]).trim() : DEFAULT_STATS,
        });
    }

    return contatos.length > 0 ? contatos : 'Nenhum contato válido encontrado na planilha.';
}

export default function UploadContatos({ onParsed, onClear }: UploadContatosProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File) => {
        setError(null);
        setFileName(null);
        setDetectedFormat(null);
        setCount(0);

        const ext = getExtension(file.name);
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setError(`Formato "${ext}" não suportado. Aceitos: ${ACCEPTED_EXTENSIONS.join(', ')}`);
            return;
        }

        const format: DetectedFormat = ext === '.xlsx' ? 'XLSX'
            : ext === '.xls' ? 'XLS'
                : ext === '.tsv' ? 'TSV'
                    : ext === '.txt' ? 'TXT'
                        : 'CSV';

        if (ext === '.xlsx' || ext === '.xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as ArrayBuffer;
                if (!data) { setError('Falha ao ler arquivo.'); return; }

                const result = parseExcelContent(data);
                if (typeof result === 'string') { setError(result); return; }

                setFileName(file.name);
                setDetectedFormat(format);
                setCount(result.length);
                onParsed(result);
            };
            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (!text) { setError('Arquivo vazio.'); return; }

                const result = parseTextContent(text);
                if (typeof result === 'string') { setError(result); return; }

                setFileName(file.name);
                setDetectedFormat(format);
                setCount(result.length);
                onParsed(result);
            };
            reader.readAsText(file, 'UTF-8');
        }
    }, [onParsed]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    }, [processFile]);

    const handleClear = () => {
        setFileName(null);
        setDetectedFormat(null);
        setError(null);
        setCount(0);
        if (inputRef.current) inputRef.current.value = '';
        onClear();
    };

    return (
        <div className="space-y-3">
            {/* Drag & Drop Zone */}
            {!fileName && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                        ${dragActive
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border hover:border-primary/40 hover:bg-primary/5'}
                    `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT_STRING}
                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-primary/10">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-wider">Arraste sua planilha ou clique para selecionar</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                CSV, Excel, TSV ou TXT — colunas: <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">name</code>, <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">phone</code> <span className="text-muted-foreground/60">(stats opcional)</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success */}
            {fileName && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                {detectedFormat === 'XLSX' || detectedFormat === 'XLS'
                                    ? <FileSpreadsheet className="w-4 h-4" />
                                    : <FileText className="w-4 h-4" />
                                }
                                {fileName}
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                                    {detectedFormat}
                                </span>
                            </p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                {count} contato{count !== 1 ? 's' : ''} válido{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClear} className="p-2 rounded-xl hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
