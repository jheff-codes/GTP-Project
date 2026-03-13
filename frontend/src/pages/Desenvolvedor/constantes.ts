import { Cpu, History, Send, type LucideIcon } from 'lucide-react';

// ═══ Interfaces ═══

export interface LogEntry {
    id: string;
    level: string;
    message: string;
    created_at: string;
    source?: 'automation' | 'system';
    action_type?: string;
}

export interface AutomationConfig {
    id?: string;
    name: string;
    system_prompt: string;
    interval_minutes: number;
    is_active: boolean;
    automation_status: 'RUNNING' | 'STOPPED';
    metadata: any;
    agency_id: string | null;
}

export interface ErrorAlertMetadata {
    uazapi_url: string;
    uazapi_token: string;
    target_phone: string;
    message_template: string;
}

export interface ErrorAlertConfig {
    id?: string;
    name: string;
    is_active: boolean;
    automation_status: 'RUNNING' | 'STOPPED';
    metadata: ErrorAlertMetadata;
    agency_id: string | null;
}

export interface AutomationDef {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
}

export interface Agency {
    id: string;
    name: string;
}

export type ViewMode = 'config' | 'logs';
export type ConfigScope = 'global' | 'local_custom' | 'local_inherited';
export type LogCategory = 'automation' | 'system' | 'all' | 'error' | 'login' | 'redistribution' | 'checkin' | 'dispatch' | 'notification';

// ═══ Constantes ═══

export const AUTOMATIONS: AutomationDef[] = [
    { id: 'broker_management', name: 'Gestão de Corretores', icon: Cpu, description: 'Controle de check-in/out e limpeza de sessões.' },
    { id: 'stalled_clients_distribution', name: 'Clientes Represados', icon: History, description: 'Redistribuição automática por roleta.' },
    { id: 'message_dispatch', name: 'Disparos de Mensagem', icon: Send, description: 'Envio sequencial de mensagens para leads (SDR).' },
];

export const DEFAULT_WHATSAPP_PROMPT = `*NOVO LEAD CHEGOU* 🚀

{saudacao}, {broker_name}! O sistema acabou de selecionar um cliente para você.

👤 *Nome:* {lead_name}
📱 *Telefone:* +{lead_phone}

Você pode acompanhar a conversa pelo sistema, ou pausar a IA para você atender!`;

export const SYSTEM_LOG_KEYWORDS = ['LOGIN', 'CHECK-IN', 'CHECK-OUT', 'ENTROU', 'SAIU', 'CHECKIN', 'CHECKOUT'];

// ═══ Default Metadata por Automação ═══

export function getDefaultMetadata(automationId: string): any {
    switch (automationId) {
        case 'broker_management':
            return { logout_anticipation_minutes: 0 };
        case 'stalled_clients_distribution':
            return {
                distribution_time: '09:00',
                uazapi_url: 'https://iagtp.uazapi.com',
                uazapi_token: '',
                uazapi_instance: '',
                whatsapp_notification_enabled: false,
                whatsapp_notification_prompt: DEFAULT_WHATSAPP_PROMPT,
            };
        case 'message_dispatch':
            return {
                horario_inicial: 8,
                horario_final: 18,
                limite_disparos: 1,
                max_per_day: 10,
                delay_minimo: 5,
                delay_maximo: 12,
                active_days: 2,
                pause_days: 1,
                randomize_pattern: false,
                cycle_start_date: new Date().toISOString().split('T')[0],
                dispatch_table: '',
                prefix: '',
                uazapi_instances: [],
                mensagem_1_variants: [],
                mensagem_2_variants: [],
            };
        case 'error_alerts':
            return {
                uazapi_url: '',
                uazapi_token: '',
                target_phone: '',
                message_template: '⚠️ *ERRO CRÍTICO*\n📍 Local: {local}\n❌ Erro: {erro}\n🕐 Horário: {horario}',
            };
        default:
            return {};
    }
}

// ═══ Helpers ═══

export function isSystemLogEntry(msg: string): boolean {
    const upper = (msg || '').toUpperCase();
    return SYSTEM_LOG_KEYWORDS.some(kw => upper.includes(kw));
}

export function getSystemLogLevel(actionType: string): string {
    if (!actionType) return 'INFO';
    const at = actionType.toUpperCase();
    if (at.includes('FAIL') || at.includes('ERROR') || at.includes('BLOCK')) return 'WARNING';
    if (at.includes('LOGOUT') || at.includes('CHECKOUT')) return 'INFO';
    if (at.includes('CHECKIN') || at.includes('UNBLOCK') || at.includes('DISTRIBUTION')) return 'SUCCESS';
    return 'INFO';
}

export function cleanDispatchMetadata(meta: any): any {
    if (!meta) return meta;
    const cleaned = { ...meta };
    delete cleaned.nome_ia;
    delete cleaned.mensagem_1;
    delete cleaned.mensagem_2;
    delete cleaned.mensagem_3;
    delete cleaned.greeting_template;
    delete cleaned.greeting_variants;
    delete cleaned.mensagem_3_variants;
    for (const key of ['mensagem_1_variants', 'mensagem_2_variants']) {
        if (Array.isArray(cleaned[key])) {
            cleaned[key] = cleaned[key].filter((v: string) => v && v.trim().length > 0);
        }
    }
    return cleaned;
}
