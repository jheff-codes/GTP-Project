import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Client } from '@/lib/database.types';

interface UseClientesRedistribuicaoParams {
    clients: Client[] | undefined;
    profiles: any[] | undefined;
    currentUser: any;
    updateClient: any;
    filteredClients: Client[];
    leadsEmEspera: Client[];
    canRedistribute: boolean;
}

export const useClientesRedistribuicao = ({
    clients,
    profiles,
    currentUser,
    updateClient,
    filteredClients,
    leadsEmEspera,
    canRedistribute,
}: UseClientesRedistribuicaoParams) => {
    const [selectedForRedistribute, setSelectedForRedistribute] = useState<number[]>([]);

    // Helper to filter subordinates
    const getSubordinates = useCallback((user: any, allProfiles: any[]) => {
        if (!user || user.role === 'admin' || user.role === 'imobiliaria' || user.role === 'imob') {
            return allProfiles.filter(p => ['broker', 'corretor', 'manager', 'coordinator', 'director'].includes(p.role));
        }

        const findSubs = (parentId: string): string[] => {
            const direct = allProfiles.filter(p =>
                p.director_id === parentId ||
                p.manager_id === parentId ||
                p.coordinator_id === parentId
            ).map(p => p.id);

            let all = [...direct];
            direct.forEach(subId => {
                all = [...all, ...findSubs(subId)];
            });
            return all;
        };

        const subIds = findSubs(user.id);
        return allProfiles.filter(p => subIds.includes(p.id));
    }, []);

    // Get brokers (filtered by hierarchy)
    const brokers = profiles?.filter(p => {
        const isBroker = ['broker', 'corretor', 'admin', 'adm'].includes(p.role?.toLowerCase() || '');
        if (!isBroker) return false;

        if (!currentUser) return false;
        if (currentUser.role === 'admin' || currentUser.role === 'imobiliaria' || (currentUser.role as string) === 'imob') return true;

        const subs = getSubordinates(currentUser, profiles || []);
        return subs.some(s => s.id === p.id);
    }).sort((a, b) => {
        const aActive = a.active === 'ativado';
        const bActive = b.active === 'ativado';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        const timeA = a.checkin || '99:99:99';
        const timeB = b.checkin || '99:99:99';
        return timeA.localeCompare(timeB);
    }) || [];

    // Redistribute single client
    const handleRedistributeSingle = async (clientId: number, brokerId: string) => {
        if (!canRedistribute) {
            toast.error('Sem permissão para redistribuir');
            return;
        }
        try {
            if (!currentUser) return;

            const client = clients?.find(c => c.id === clientId);
            const broker = profiles?.find(p => p.id === brokerId);

            await updateClient.mutateAsync({
                id: clientId,
                updates: {
                    owner_id: brokerId,
                    status: 'lead'
                },
            });

            // Insert Notification
            await supabase.from('notifications').insert({
                user_id: brokerId,
                agency_id: currentUser.agency_id || currentUser.id,
                title: 'Novo Lead Atribuído',
                message: `O lead ${client?.name || client?.phone} foi atribuído a você.`,
                type: 'lead_assigned',
                link_path: `/leads?id=${clientId}`,
                read: false
            });

            // Webhook Trigger
            try {
                if (client && broker) {
                    await fetch('https://nwn.iagtp.com.br/webhook/mudar-corretor-do-lead-map', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            agency_id: currentUser.agency_id || currentUser.id,
                            phone: client.phone,
                            new_broker_id: brokerId,
                            new_broker_name: broker.name,
                            distributor_id: currentUser.id
                        })
                    });
                }
            } catch (err) {
                console.error("Webhook error", err);
            }

            toast.success('Lead redistribuído e enviado para Repasse!');
        } catch (error) {
            toast.error('Erro ao redistribuir');
        }
    };

    // Round-robin redistribution for selected
    const handleRedistributeAll = async () => {
        if (!profiles || profiles.length === 0) {
            toast.error('Nenhum corretor disponível');
            return;
        }

        const availableBrokers = getSubordinates(currentUser, profiles)
            .filter(p => p.role === 'broker' || (p.role as string) === 'corretor')
            .sort((a, b) => {
                const aActive = a.active === 'ativado';
                const bActive = b.active === 'ativado';
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;

                const timeA = a.checkin || '99:99:99';
                const timeB = b.checkin || '99:99:99';
                return timeA.localeCompare(timeB);
            });

        if (availableBrokers.length === 0) {
            toast.error('Nenhum corretor disponível na sua equipe');
            return;
        }

        const clientsToRedistribute = selectedForRedistribute.length > 0
            ? clients?.filter(c => selectedForRedistribute.includes(c.id)) || []
            : leadsEmEspera;

        let brokerIndex = 0;
        for (const client of clientsToRedistribute) {
            try {
                const targetBroker = availableBrokers[brokerIndex % availableBrokers.length];

                await updateClient.mutateAsync({
                    id: client.id,
                    updates: {
                        owner_id: targetBroker.id,
                        status: 'lead'
                    },
                });

                // Insert Notification (Non-blocking)
                supabase.from('notifications').insert({
                    user_id: targetBroker.id,
                    agency_id: currentUser?.agency_id || currentUser?.id,
                    title: 'Novo Lead Atribuído',
                    message: `O lead ${client.name || client.phone} foi atribuído a você.`,
                    type: 'lead_assigned',
                    link_path: `/leads?id=${client.id}`,
                    read: false
                }).then(({ error }) => {
                    if (error) console.error("Notification insert error", error);
                });

                // Webhook Trigger (Fire and forget)
                fetch('https://nwn.iagtp.com.br/webhook/mudar-corretor-do-lead-map', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agency_id: currentUser?.agency_id || currentUser?.id,
                        phone: client.phone,
                        new_broker_id: targetBroker.id,
                        new_broker_name: targetBroker.name,
                        distributor_id: currentUser?.id
                    })
                }).catch(err => console.error("Webhook loop error", err));

                brokerIndex++;
            } catch (error) {
                console.error('Erro ao redistribuir:', error);
            }
        }

        toast.success(`${clientsToRedistribute.length} leads redistribuídos!`);
        setSelectedForRedistribute([]);
    };

    const toggleSelection = (clientId: number) => {
        setSelectedForRedistribute(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const selectAllVisibleLeads = () => {
        const ids = filteredClients.map(c => c.id);
        setSelectedForRedistribute(ids);
    };

    const clearSelection = () => {
        setSelectedForRedistribute([]);
    };

    return {
        selectedForRedistribute,
        handleRedistributeSingle,
        handleRedistributeAll,
        brokers,
        toggleSelection,
        selectAllVisibleLeads,
        clearSelection,
    };
};
