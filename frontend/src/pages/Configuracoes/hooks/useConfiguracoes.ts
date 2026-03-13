import { useState, useEffect } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Profile } from '@/lib/database.types';

// Tipo local para configurações de agência (campos do profile + automação)
export type Config = {
    prefix?: string | null;
    allowed_ips?: string[] | null;
    ip_required_days?: number[] | null;
    access_schedules?: AccessSchedule[] | null;
    checkin_start?: string | null;
    checkin_end?: string | null;
    name?: string | null;
    creci?: string | null;
    address?: string | null;
};

export type AccessSchedule = {
    start: string;
    end: string;
};

export const WEEKDAYS = [
    { id: 0, label: 'D', full: 'Domingo' },
    { id: 1, label: 'S', full: 'Segunda' },
    { id: 2, label: 'T', full: 'Terça' },
    { id: 3, label: 'Q', full: 'Quarta' },
    { id: 4, label: 'Q', full: 'Quinta' },
    { id: 5, label: 'S', full: 'Sexta' },
    { id: 6, label: 'S', full: 'Sábado' },
];

export function useConfiguracoes() {
    const { data: profiles, refetch } = useProfiles();

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [config, setConfig] = useState<Partial<Config>>({
        ip_required_days: [],
        allowed_ips: [],
        prefix: '',
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        creci: '',
        role: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const profile = profileData as Profile;
            if (profileError) throw profileError;
            if (!profile) return;

            setCurrentUser(profile);
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || '',
                creci: profile.creci || '',
                role: profile.role || '',
            });

            const { data: configData } = await supabase
                .from('profiles')
                .select('allowed_ips, ip_required_days, prefix')
                .eq('id', user.id)
                .single();

            if (configData) {
                setConfig(configData);
            }
        } catch (error: any) {
            console.error('Error loading settings:', error);
            toast.error('Erro ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const updates = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                creci: formData.creci,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase
                .from('profiles') as any)
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;
            toast.success('Perfil atualizado com sucesso!');
            refetch();
        } catch (error: any) {
            toast.error('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveIpConfig = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const configData = {
                allowed_ips: config.allowed_ips,
                ip_required_days: config.ip_required_days,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase
                .from('profiles') as any)
                .update(configData)
                .eq('id', currentUser.id);

            if (error) throw error;
            toast.success('Configurações de IP salvas com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao salvar configurações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error('As senhas não coincidem.');
            return;
        }
        if (passwordForm.new.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
            if (error) throw error;

            await (supabase.from('profiles') as any).update({ senha: passwordForm.new }).eq('id', currentUser?.id);

            toast.success('Senha alterada com sucesso!');
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            toast.error('Erro ao alterar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId: number) => {
        const days = config.ip_required_days || [];
        if (days.includes(dayId)) {
            setConfig({ ...config, ip_required_days: days.filter(d => d !== dayId) });
        } else {
            setConfig({ ...config, ip_required_days: [...days, dayId] });
        }
    };

    const addSchedule = () => {
        const schedules = (config.access_schedules as AccessSchedule[]) || [];
        setConfig({ ...config, access_schedules: [...schedules, { start: '09:00', end: '09:10' }] });
    };

    const updateSchedule = (index: number, field: 'start' | 'end', value: string) => {
        const schedules = [...((config.access_schedules as AccessSchedule[]) || [])];
        schedules[index] = { ...schedules[index], [field]: value };
        setConfig({ ...config, access_schedules: schedules });
    };

    const removeSchedule = (index: number) => {
        const schedules = [...((config.access_schedules as AccessSchedule[]) || [])];
        schedules.splice(index, 1);
        setConfig({ ...config, access_schedules: schedules });
    };

    const fetchMyIp = async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            const currentIps = config.allowed_ips || [];
            if (!currentIps.includes(data.ip)) {
                setConfig(prev => ({
                    ...prev,
                    allowed_ips: [...(prev.allowed_ips || []), data.ip],
                }));
                toast.success(`IP Adicionado: ${data.ip}`);
            } else {
                toast.info('IP já está na lista.');
            }
        } catch {
            toast.error('Erro ao obter IP');
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            setLoading(true);
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await (supabase
                .from('profiles') as any)
                .update({ avatar_url: publicUrl })
                .eq('id', currentUser?.id);

            if (updateError) throw updateError;

            setCurrentUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
            toast.success('Foto de perfil atualizada!');
        } catch (error: any) {
            toast.error('Erro ao fazer upload: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isImobiliaria = currentUser?.role === 'imobiliaria' || currentUser?.role === 'admin' || (currentUser?.role as string) === 'imob';

    return {
        profiles,
        loading,
        currentUser,
        config,
        setConfig,
        formData,
        setFormData,
        passwordForm,
        setPasswordForm,
        isImobiliaria,
        handleSaveProfile,
        handleSaveIpConfig,
        handlePasswordChange,
        toggleDay,
        addSchedule,
        updateSchedule,
        removeSchedule,
        fetchMyIp,
        handleAvatarUpload,
    };
}
