
import type { Client } from '@/lib/database.types';

export const getLeadScore = (client: Client) => {
    // 1. HOT (Quente) 🔥
    // Renda > 20k OR Status avançado (Visita, Proposta, Venda)
    const isHighIncome = client.renda && parseFloat(client.renda) > 20000;
    const isAdvancedStatus = ['visit', 'proposal', 'sale'].includes(client.status || '');

    if (isHighIncome || isAdvancedStatus) {
        return { icon: '🔥', color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Quente' };
    }

    // 2. WARM (Morno) ☀️
    // Renda > 5k OR Status Qualificado/Agendando
    const isMidIncome = client.renda && parseFloat(client.renda) > 5000;
    const isMidStatus = ['qualifying', 'qualified', 'scheduling', 'call'].includes(client.status || '');

    if (isMidIncome || isMidStatus) {
        return { icon: '☀️', color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Morno' };
    }

    // 3. COLD (Frio) ❄️
    return { icon: '❄️', color: 'text-blue-300', bg: 'bg-blue-500/5', label: 'Frio' };
};
