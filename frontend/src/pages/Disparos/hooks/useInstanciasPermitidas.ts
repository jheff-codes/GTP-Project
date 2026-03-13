import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * Hook que retorna os nomes de instâncias que o usuário logado pode ver.
 * - Admin/imobiliária: null (sem filtro, vê tudo)
 * - Outros: array com instance_names dele + subordinados
 */
export function useInstanciasPermitidas() {
    const { data: currentUser } = useCurrentUser();
    const [allowedInstances, setAllowedInstances] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) { setLoading(false); return; }

        const role = currentUser.role as string;

        // Admin e imobiliária veem tudo
        if (role === 'admin' || role === 'imobiliaria' || role === 'imob') {
            setAllowedInstances(null); // null = sem filtro
            setLoading(false);
            return;
        }

        // Outros roles: buscar subordinados
        (async () => {
            setLoading(true);
            try {
                const agencyId = currentUser.agency_id || currentUser.id;

                // Buscar todos os profiles da agência
                const { data: teamProfiles } = await (supabase as any)
                    .from('profiles')
                    .select('id, instance_name, director_id, manager_id, coordinator_id, agency_id, role')
                    .eq('agency_id', agencyId);

                if (!teamProfiles) { setAllowedInstances([]); setLoading(false); return; }

                // Encontrar subordinados recursivamente
                const getSubordinates = (parentId: string): any[] => {
                    const directs = teamProfiles.filter((p: any) =>
                        p.director_id === parentId ||
                        p.manager_id === parentId ||
                        p.coordinator_id === parentId
                    );
                    let allSubs = [...directs];
                    directs.forEach((sub: any) => {
                        const subSubs = getSubordinates(sub.id);
                        subSubs.forEach((ss: any) => {
                            if (!allSubs.some((e: any) => e.id === ss.id)) allSubs.push(ss);
                        });
                    });
                    return allSubs;
                };

                const subordinates = getSubordinates(currentUser.id);

                // Coletar instance_names: dele + subordinados
                const names = new Set<string>();
                const myInstance = (currentUser as any).instance_name;
                if (myInstance) names.add(myInstance.toLowerCase());

                subordinates.forEach((p: any) => {
                    if (p.instance_name) names.add(p.instance_name.toLowerCase());
                });

                setAllowedInstances(Array.from(names));
            } catch {
                setAllowedInstances([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [currentUser]);

    return { allowedInstances, loading };
}
