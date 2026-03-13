import type { Client } from '@/lib/database.types';

/**
 * Retorna o nome do responsável pelo lead.
 */
export const getOwnerName = (ownerId: string | null, profiles: any[] | undefined): string => {
    if (!ownerId) return 'Sem responsável';
    const profile = profiles?.find(p => p.id === ownerId);
    return profile?.name || 'N/A';
};

/**
 * Retorna as iniciais de um nome (máximo 2 caracteres).
 */
export const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

/**
 * Formata valor numérico como moeda BRL.
 */
export const formatCurrency = (value: string | null): string => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

/**
 * Gera dados para gráficos de barras a partir de um campo do Client.
 * Retorna top 10 valores ordenados por frequência.
 */
export const getChartData = (field: keyof Client, clients: Client[]) => {
    const counts: { [key: string]: number } = {};
    clients.forEach(c => {
        const val = c[field]?.toString() || 'Não informado';
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.name !== 'Não informado')
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
};

/**
 * Gera dados de distribuição de renda em faixas para gráfico.
 */
export const getIncomeData = (clients: Client[]) => {
    const ranges: Record<string, number> = {
        'Até 5k': 0,
        '5k - 10k': 0,
        '10k - 20k': 0,
        '20k - 50k': 0,
        'Acima de 50k': 0,
        'Não informado': 0,
    };

    clients.forEach(c => {
        if (!c.renda) {
            ranges['Não informado']++;
            return;
        }
        const val = parseFloat(c.renda);
        if (isNaN(val)) {
            ranges['Não informado']++;
        } else if (val <= 5000) {
            ranges['Até 5k']++;
        } else if (val <= 10000) {
            ranges['5k - 10k']++;
        } else if (val <= 20000) {
            ranges['10k - 20k']++;
        } else if (val <= 50000) {
            ranges['20k - 50k']++;
        } else {
            ranges['Acima de 50k']++;
        }
    });

    return Object.entries(ranges)
        .filter(([name]) => name !== 'Não informado')
        .map(([name, value]) => ({ name, value }));
};
