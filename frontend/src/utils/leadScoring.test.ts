
import { describe, it, expect } from 'vitest';
import { getLeadScore } from './leadScoring';
import type { Client } from '@/lib/database.types';

describe('Lead Scoring Logic', () => {
    it('should classify as HOT 🔥 if income > 20k', () => {
        const client = { renda: '25000', status: 'lead' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Quente');
        expect(score.icon).toBe('🔥');
    });

    it('should classify as HOT 🔥 if status is Visit', () => {
        const client = { renda: '1000', status: 'visit' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Quente');
    });

    it('should classify as WARM ☀️ if income > 5k', () => {
        const client = { renda: '6000', status: 'lead' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Morno');
        expect(score.icon).toBe('☀️');
    });

    it('should classify as WARM ☀️ if status is Qualifying', () => {
        const client = { renda: '1000', status: 'qualifying' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Morno');
    });

    it('should classify as COLD ❄️ if income is low and status is early', () => {
        const client = { renda: '1000', status: 'lead' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Frio');
        expect(score.icon).toBe('❄️');
    });

    it('should classify as COLD ❄️ if no data', () => {
        const client = { status: '' } as Client;
        const score = getLeadScore(client);
        expect(score.label).toBe('Frio');
    });
});
