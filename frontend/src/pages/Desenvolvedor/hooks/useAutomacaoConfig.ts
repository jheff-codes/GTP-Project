import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    type AutomationConfig,
    type ErrorAlertConfig,
    type ErrorAlertMetadata,
    type ConfigScope,
    getDefaultMetadata,
    cleanDispatchMetadata,
} from '../constantes';

interface UseAutomacaoConfigProps {
    currentUser: any;
    activeAutomation: string;
    isGlobal: boolean;
    selectedAgency: string;
}

export function useAutomacaoConfig({
    currentUser,
    activeAutomation,
    isGlobal,
    selectedAgency,
}: UseAutomacaoConfigProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<AutomationConfig | null>(null);
    const [configScope, setConfigScope] = useState<ConfigScope>('global');

    // ═══ Progress Tracking (Realtime) ═══
    const [progressData, setProgressData] = useState<{
        current_action: string;
        progress_percent: number;
    }>({ current_action: 'Aguardando ciclo...', progress_percent: 0 });

    const [instanceProgress, setInstanceProgress] = useState<
        Record<string, { percent: number; action: string }>
    >({});

    // ═══ Error Alert Config ═══
    const [errorAlertConfig, setErrorAlertConfig] = useState<ErrorAlertConfig | null>(null);
    const [savingErrorAlert, setSavingErrorAlert] = useState(false);

    // ═══ Load Config ═══
    const loadConfig = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'admin') return;
        setLoading(true);

        try {
            let query = (supabase as any)
                .from('automation_settings')
                .select('*')
                .eq('name', activeAutomation);

            if (isGlobal) {
                query = query.is('agency_id', null);
            } else {
                if (selectedAgency === 'all') {
                    setLoading(false);
                    setConfig(null);
                    setConfigScope('global');
                    return;
                }
                query = query.eq('agency_id', selectedAgency);
            }

            const { data, error } = await query.maybeSingle();
            if (error) throw error;

            const defaultMetadata = getDefaultMetadata(activeAutomation);

            if (!data) {
                setConfig({
                    name: activeAutomation,
                    system_prompt: '',
                    interval_minutes: 1,
                    is_active: true,
                    automation_status: 'STOPPED',
                    metadata: defaultMetadata,
                    agency_id: isGlobal ? null : selectedAgency
                });
                setConfigScope(isGlobal ? 'global' : 'local_inherited');
            } else {
                setConfig(data as AutomationConfig);
                setConfigScope(isGlobal ? 'global' : 'local_custom');
                if (data.current_action || data.progress_percent) {
                    setProgressData({
                        current_action: data.current_action || 'Aguardando ciclo...',
                        progress_percent: data.progress_percent || 0,
                    });
                }
            }
        } catch (error: any) {
            console.error('Erro ao carregar configurações:', error);
            toast.error('Erro ao carregar configurações: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeAutomation, isGlobal, selectedAgency]);

    // Trigger load on dependency change
    useEffect(() => { loadConfig(); }, [loadConfig]);

    // ═══ Realtime Subscription ═══
    useEffect(() => {
        if (!activeAutomation) return;

        const channel = supabase
            .channel(`progress-${activeAutomation}`)
            .on(
                'postgres_changes' as any,
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'automation_settings',
                    filter: `name=eq.${activeAutomation}`,
                },
                (payload: any) => {
                    const newRow = payload.new;
                    if (!newRow) return;

                    const matchesScope = isGlobal
                        ? !newRow.agency_id
                        : newRow.agency_id === selectedAgency;

                    if (matchesScope) {
                        setProgressData({
                            current_action: newRow.current_action || 'Aguardando ciclo...',
                            progress_percent: newRow.progress_percent || 0,
                        });

                        if (newRow.instance_progress) {
                            let parsedProgress = newRow.instance_progress;
                            if (typeof parsedProgress === 'string') {
                                try { parsedProgress = JSON.parse(parsedProgress); } catch { /* ignore */ }
                            }
                            if (typeof parsedProgress === 'object' && parsedProgress !== null) {
                                const fresh: Record<string, { percent: number; action: string }> = {};
                                for (const [key, val] of Object.entries(parsedProgress)) {
                                    fresh[key] = { ...(val as any) };
                                }
                                setInstanceProgress(fresh);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeAutomation, isGlobal, selectedAgency]);

    // ═══ Polling Fallback (Dispatch) ═══
    useEffect(() => {
        if (activeAutomation !== 'message_dispatch' || config?.automation_status !== 'RUNNING') return;

        const interval = setInterval(async () => {
            try {
                let query = (supabase as any)
                    .from('automation_settings')
                    .select('instance_progress, current_action, progress_percent')
                    .eq('name', 'message_dispatch');

                if (isGlobal) {
                    query = query.is('agency_id', null);
                } else if (selectedAgency && selectedAgency !== 'all') {
                    query = query.eq('agency_id', selectedAgency);
                }

                const { data } = await query.single();

                if (data) {
                    setProgressData({
                        current_action: data.current_action || 'Aguardando ciclo...',
                        progress_percent: data.progress_percent || 0,
                    });

                    if (data.instance_progress) {
                        let parsed = data.instance_progress;
                        if (typeof parsed === 'string') {
                            try { parsed = JSON.parse(parsed); } catch { /* ignore */ }
                        }
                        if (typeof parsed === 'object' && parsed !== null) {
                            const fresh: Record<string, { percent: number; action: string }> = {};
                            for (const [key, val] of Object.entries(parsed)) {
                                fresh[key] = { ...(val as any) };
                            }
                            setInstanceProgress(fresh);
                        }
                    } else {
                        setInstanceProgress({});
                    }
                }
            } catch {
                // Silenciar erros de polling
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeAutomation, config?.automation_status, isGlobal, selectedAgency]);

    // ═══ Save Config ═══
    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const finalMetadata = config.name === 'message_dispatch'
                ? cleanDispatchMetadata(config.metadata)
                : config.metadata;

            const payload = {
                name: config.name,
                system_prompt: config.system_prompt,
                interval_minutes: config.interval_minutes,
                is_active: config.automation_status === 'RUNNING',
                automation_status: config.automation_status || 'STOPPED',
                metadata: finalMetadata,
                agency_id: isGlobal ? null : selectedAgency,
                updated_at: new Date().toISOString()
            };

            const { error: upsertError } = await (supabase as any)
                .from('automation_settings')
                .upsert(payload, { onConflict: 'name,agency_id' });

            if (upsertError) throw upsertError;
            toast.success('Configurações salvas com sucesso!');

            let reloadQuery = (supabase as any)
                .from('automation_settings')
                .select('*')
                .eq('name', config.name);

            if (isGlobal) {
                reloadQuery = reloadQuery.is('agency_id', null);
            } else {
                reloadQuery = reloadQuery.eq('agency_id', selectedAgency);
            }

            const { data } = await reloadQuery.maybeSingle();
            if (data) {
                setConfig(data as AutomationConfig);
                setConfigScope(isGlobal ? 'global' : 'local_custom');
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar: Verifique duplicidade ou permissões.');
        } finally {
            setSaving(false);
        }
    };

    // ═══ Reset Config ═══
    const handleResetConfig = async () => {
        if (!config || isGlobal || configScope !== 'local_custom') return;
        if (!confirm('Tem certeza? Isso apagará a configuração personalizada desta unidade e ela voltará a seguir o padrão Global.')) return;

        setSaving(true);
        try {
            const { error, count } = await supabase
                .from('automation_settings')
                .delete({ count: 'exact' })
                .eq('name', activeAutomation)
                .eq('agency_id', selectedAgency);

            if (error) throw error;

            if (count === 0) {
                toast.warning('Nenhuma configuração encontrada para excluir.');
            } else {
                toast.success('Configuração restaurada para o padrão Global!');
            }

            await loadConfig();
        } catch (error: any) {
            console.error('Erro ao resetar:', error);
            toast.error(`Erro ao restaurar configuração: ${error.message || error}`);
        } finally {
            setSaving(false);
        }
    };

    // ═══ Toggle Status (Start/Stop) ═══
    const handleToggleStatus = async (newStatus: 'RUNNING' | 'STOPPED') => {
        if (!config) return;
        setSaving(true);
        try {
            const updatedConfig = { ...config, automation_status: newStatus, is_active: newStatus === 'RUNNING' };
            setConfig(updatedConfig);

            const finalMeta = updatedConfig.name === 'message_dispatch'
                ? cleanDispatchMetadata(updatedConfig.metadata)
                : updatedConfig.metadata;

            const payload = {
                name: updatedConfig.name,
                system_prompt: updatedConfig.system_prompt,
                interval_minutes: updatedConfig.interval_minutes,
                is_active: newStatus === 'RUNNING',
                automation_status: newStatus,
                metadata: finalMeta,
                agency_id: isGlobal ? null : selectedAgency,
                updated_at: new Date().toISOString()
            };

            const { error: upsertError } = await (supabase as any)
                .from('automation_settings')
                .upsert(payload, { onConflict: 'name,agency_id' });

            if (upsertError) throw upsertError;

            toast.success(newStatus === 'RUNNING'
                ? '▶ Automação INICIADA e salva no banco!'
                : '⏹ Automação PARADA e salva no banco!'
            );
        } catch (error: any) {
            console.error('Erro ao alternar status:', error);
            toast.error('Erro ao salvar status: ' + (error.message || error));
            setConfig(prev => prev ? { ...prev, automation_status: newStatus === 'RUNNING' ? 'STOPPED' : 'RUNNING' } : null);
        } finally {
            setSaving(false);
        }
    };

    // ═══ Error Alert Config ═══
    const loadErrorAlertConfig = useCallback(async () => {
        try {
            let query = (supabase as any)
                .from('automation_settings')
                .select('*')
                .eq('name', 'error_alerts');

            if (isGlobal) {
                query = query.is('agency_id', null);
            } else if (selectedAgency && selectedAgency !== 'all') {
                query = query.eq('agency_id', selectedAgency);
            }

            const { data } = await query.maybeSingle();

            if (data) {
                const meta = data.metadata || {} as ErrorAlertMetadata;
                setErrorAlertConfig({
                    id: data.id,
                    name: data.name,
                    is_active: data.is_active ?? false,
                    automation_status: data.automation_status || 'STOPPED',
                    metadata: {
                        uazapi_url: meta.uazapi_url || '',
                        uazapi_token: meta.uazapi_token || '',
                        target_phone: meta.target_phone || '',
                        message_template: meta.message_template || '',
                    },
                    agency_id: data.agency_id ?? null,
                });
            } else {
                // Sem config ainda — criar estado default
                const defaultMeta = getDefaultMetadata('error_alerts') as ErrorAlertMetadata;
                setErrorAlertConfig({
                    name: 'error_alerts',
                    is_active: false,
                    automation_status: 'STOPPED',
                    metadata: defaultMeta,
                    agency_id: isGlobal ? null : selectedAgency,
                });
            }
        } catch (err) {
            console.error('Erro ao carregar config de alertas:', err);
        }
    }, [isGlobal, selectedAgency]);

    const handleSaveErrorAlert = async () => {
        if (!errorAlertConfig) return;
        setSavingErrorAlert(true);
        try {
            const payload = {
                name: 'error_alerts',
                is_active: errorAlertConfig.is_active,
                automation_status: errorAlertConfig.is_active ? 'RUNNING' : 'STOPPED',
                metadata: errorAlertConfig.metadata,
                agency_id: isGlobal ? null : selectedAgency,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await (supabase as any)
                .from('automation_settings')
                .upsert(payload, { onConflict: 'name,agency_id' });

            if (upsertError) throw upsertError;
            toast.success('Configurações de alerta salvas!');

            // Recarregar para pegar o ID gerado
            await loadErrorAlertConfig();
        } catch (error: any) {
            console.error('Erro ao salvar alertas:', error);
            toast.error('Erro ao salvar alertas: ' + error.message);
        } finally {
            setSavingErrorAlert(false);
        }
    };

    return {
        loading,
        saving,
        config,
        setConfig,
        configScope,
        progressData,
        instanceProgress,
        handleSave,
        handleResetConfig,
        handleToggleStatus,
        errorAlertConfig,
        setErrorAlertConfig,
        savingErrorAlert,
        loadErrorAlertConfig,
        handleSaveErrorAlert,
    };
}
