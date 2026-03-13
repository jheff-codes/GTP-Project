import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useProfiles } from '@/hooks/useProfiles';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Profile } from '@/lib/database.types';
import { PERMISSIONS_SCHEMA, AVAILABLE_ROLES, getRoleLabel, getRoleRank, formatPhone } from '../constantes';

type MemberForm = {
    id: string;
    name: string; email: string; phone: string; role: string;
    agency_id: string; director_id: string; manager_id: string; coordinator_id: string;
    prefix: string; password: string; address: string; creci: string; instance_name: string;
    permissions: Record<string, any>;
};

const emptyMember = (): MemberForm => ({
    id: '', name: '', email: '', phone: '', role: 'broker',
    agency_id: '', director_id: '', manager_id: '', coordinator_id: '',
    prefix: '', password: '', address: '', creci: '', instance_name: '',
    permissions: {}
});

export const useGestaoEquipe = () => {
    const { data: profiles = [], refetch } = useProfiles();
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<'team' | 'queue'>('team');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<MemberForm>(emptyMember());
    const [newMember, setNewMember] = useState<MemberForm>(emptyMember());

    // Auto-fill prefix and agency_id + permissions pre-fill when modal opens
    useEffect(() => {
        if (isAddModalOpen && currentUser) {
            let initialPermissions: any = {};
            if (currentUser.role === 'admin') {
                PERMISSIONS_SCHEMA.forEach(section => {
                    initialPermissions[section.id] = {};
                    section.actions.forEach(action => {
                        initialPermissions[section.id][action.id] = true;
                    });
                });
            } else {
                initialPermissions = JSON.parse(JSON.stringify((currentUser as any).parsedPermissions || {}));
            }

            let initialFields: Partial<MemberForm> = { permissions: initialPermissions };

            if (currentUser.role !== 'admin') {
                const isImob = currentUser.role === 'imobiliaria';
                initialFields.prefix = currentUser.prefix || '';
                initialFields.agency_id = isImob ? currentUser.id : currentUser.agency_id;

                if (currentUser.role === 'director') {
                    initialFields.director_id = currentUser.id;
                } else if (currentUser.role === 'manager') {
                    initialFields.director_id = currentUser.director_id;
                    initialFields.manager_id = currentUser.id;
                } else if (currentUser.role === 'coordinator') {
                    initialFields.director_id = currentUser.director_id;
                    initialFields.manager_id = currentUser.manager_id;
                    initialFields.coordinator_id = currentUser.id;
                }
            }

            setNewMember(prev => ({ ...prev, ...initialFields }));
        }
    }, [isAddModalOpen, currentUser]);

    // Derived data
    const validAgencies = profiles.filter(p =>
        p.role === 'imobiliaria' ||
        (p.role as string) === 'imob' ||
        p.role === 'admin'
    );

    // Phone
    const handlePhoneChange = (val: string, isEditing = false) => {
        const formatted = formatPhone(val);
        if (isEditing) {
            setEditingMember(prev => ({ ...prev, phone: formatted }));
        } else {
            setNewMember(prev => ({ ...prev, phone: formatted }));
        }
    };

    // Permissions
    const togglePermission = (section: string, action: string, isEditing = false) => {
        const setter = isEditing ? setEditingMember : setNewMember;
        setter(prev => {
            const currentSection = prev.permissions[section] || {};
            return {
                ...prev,
                permissions: { ...prev.permissions, [section]: { ...currentSection, [action]: !currentSection[action] } }
            };
        });
    };

    const toggleAllPermissions = (sectionId: string, isEditing = false) => {
        const currentState = isEditing ? editingMember : newMember;
        const setter = isEditing ? setEditingMember : setNewMember;
        const section = PERMISSIONS_SCHEMA.find(s => s.id === sectionId);
        if (!section) return;

        const allSelected = section.actions.every(action => currentState.permissions[sectionId]?.[action.id]);
        const newSectionPerms: Record<string, boolean> = {};
        section.actions.forEach(action => { newSectionPerms[action.id] = !allSelected; });

        setter(prev => ({ ...prev, permissions: { ...prev.permissions, [sectionId]: newSectionPerms } }));
    };

    // Edit modal opener
    const handleOpenEdit = (profile: Profile) => {
        setEditingMember({
            id: profile.id,
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone ? formatPhone(profile.phone) : '',
            role: profile.role,
            agency_id: profile.agency_id || '',
            director_id: profile.director_id || '',
            manager_id: profile.manager_id || '',
            coordinator_id: profile.coordinator_id || '',
            prefix: profile.prefix || '',
            password: '',
            address: profile.address || '',
            creci: profile.creci || '',
            instance_name: (profile as any).instance_name || '',
            permissions: (profile.permissions as any)?.note || {}
        });
        setEditModalOpen(true);
    };

    // Hierarchy helpers
    const getSuperiorId = (profile: Profile): string | null => {
        if (profile.coordinator_id && profile.coordinator_id !== profile.id) return profile.coordinator_id;
        if (profile.manager_id && profile.manager_id !== profile.id) return profile.manager_id;
        if (profile.director_id && profile.director_id !== profile.id) return profile.director_id;
        if (profile.agency_id && profile.agency_id !== profile.id) return profile.agency_id;
        return null;
    };

    const isEffectivelyBlocked = (profile: Profile): boolean => {
        if (profile.blocked) return true;
        const superiorId = getSuperiorId(profile);
        if (superiorId) {
            const superior = profiles.find(p => p.id === superiorId);
            if (superior) return isEffectivelyBlocked(superior);
        }
        return false;
    };

    const hasSubordinates = (userId: string) => {
        return profiles.some(p =>
            p.director_id === userId ||
            p.manager_id === userId ||
            p.coordinator_id === userId ||
            (p.agency_id === userId && p.role !== 'imobiliaria' && (p.role as string) !== 'imob' && p.role !== 'admin')
        );
    };

    const getSubordinatesRecursive = (parentId: string, allProfiles: Profile[]): Profile[] => {
        const directSubordinates = allProfiles.filter(p =>
            (p.agency_id === parentId && p.id !== parentId) ||
            p.director_id === parentId ||
            p.manager_id === parentId ||
            p.coordinator_id === parentId
        );
        let allSubs = [...directSubordinates];
        directSubordinates.forEach(sub => {
            const subSubs = getSubordinatesRecursive(sub.id, allProfiles);
            subSubs.forEach(ss => {
                if (!allSubs.some(existing => existing.id === ss.id)) allSubs.push(ss);
            });
        });
        return allSubs;
    };

    const canAssignRole = (targetRole: string) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        return getRoleRank(targetRole) <= getRoleRank(currentUser.role);
    };

    // CRUD Operations
    const handleCreateMember = async () => {
        try {
            if (!newMember.email || !newMember.name) { toast.error("Preencha campos obrigatórios"); return; }
            if (newMember.password && newMember.password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }

            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
            );

            const profileData = {
                name: newMember.name, phone: newMember.phone, role: newMember.role,
                agency_id: (currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : (newMember.agency_id || null),
                director_id: newMember.director_id || null, manager_id: newMember.manager_id || null, coordinator_id: newMember.coordinator_id || null,
                prefix: newMember.prefix, active: 'ativado', label: getRoleLabel(newMember.role),
                address: newMember.address, creci: newMember.creci, instance_name: newMember.instance_name || null,
                permissions: { note: newMember.permissions }, senha: newMember.password || 'mudar123'
            };

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: newMember.email, password: newMember.password || 'mudar123',
                options: { data: profileData }
            });
            if (authError) throw authError;

            if (authData.user) {
                const clientToUse = authData.session ? tempClient : supabase;
                const { error: profileError } = await (clientToUse.from('profiles') as any).upsert({
                    id: authData.user.id, email: newMember.email, ...profileData
                });
                if (profileError) {
                    console.error("Erro ao atualizar perfil:", profileError);
                    if (authData.session) {
                        const { error: retryError } = await (supabase.from('profiles') as any).upsert({ id: authData.user.id, email: newMember.email, ...profileData });
                        if (retryError) toast.warning("Usuário criado no Auth, mas falha ao salvar perfil (RLS). " + retryError.message);
                    } else {
                        toast.warning("Usuário criado, mas houve erro ao salvar dados do perfil (RLS?): " + profileError.message);
                    }
                }
            }
            toast.success('Membro adicionado!');
            setIsAddModalOpen(false);
            setNewMember(emptyMember());
            await tempClient.auth.signOut();
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (error: any) {
            console.error("Erro detalhado ao criar membro:", error);
            if (error.code === 'over_email_send_rate_limit') toast.error('Limite de envio de emails excedido.');
            else if (error.status === 422 || error.message?.includes('422')) toast.error('Erro 422: Verifique os dados. ' + (error.message || ''));
            else toast.error('Erro: ' + (error.message || 'Erro desconhecido'));
        }
    };

    const handleUpdateMember = async () => {
        try {
            if (!editingMember.id) return;
            const updates: any = {
                name: editingMember.name, phone: editingMember.phone, role: editingMember.role,
                agency_id: editingMember.agency_id || null, director_id: editingMember.director_id || null,
                manager_id: editingMember.manager_id || null, coordinator_id: editingMember.coordinator_id || null,
                prefix: editingMember.prefix, label: getRoleLabel(editingMember.role),
                address: editingMember.address, creci: editingMember.creci,
                instance_name: editingMember.instance_name || null,
                permissions: { note: editingMember.permissions },
                ...(editingMember.password ? { senha: editingMember.password } : {})
            };

            if (currentUser?.role === 'admin' && editingMember.email) updates.email = editingMember.email;

            const { error } = await (supabase.from('profiles') as any).update(updates).eq('id', editingMember.id);
            if (error) throw error;

            if (editingMember.password) {
                const { data: passData, error: passError } = await supabase.functions.invoke('update-user-password', {
                    body: { user_id: editingMember.id, new_password: editingMember.password, requester_id: currentUser?.id }
                });
                if (passError || passData?.error) {
                    toast.warning("Senha não pôde ser atualizada: " + (passData?.error || passError?.message));
                } else {
                    toast.success("Senha atualizada!");
                }
            }

            toast.success('Dados atualizados!');
            setEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (error: any) {
            toast.error('Erro ao atualizar: ' + error.message);
        }
    };

    const confirmDelete = (profile: Profile) => {
        if (hasSubordinates(profile.id)) { toast.error("Não é possível excluir usuário com subordinados."); return; }
        setProfileToDelete(profile);
        setEditModalOpen(false);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!profileToDelete) return;
        try {
            const superiorId = getSuperiorId(profileToDelete);
            if (superiorId) {
                const { error: reassignError } = await (supabase.from('clients') as any).update({ owner_id: superiorId } as any).eq('owner_id', profileToDelete.id);
                if (reassignError) throw reassignError;
                toast.info(`Leads transferidos para o superior.`);
            }
            const { error: deleteError } = await supabase.from('profiles').delete().eq('id', profileToDelete.id);
            if (deleteError) throw deleteError;
            toast.success("Usuário excluído.");
            setDeleteModalOpen(false);
            setProfileToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (e: any) {
            toast.error("Erro ao excluir: " + e.message);
        }
    };

    const handleUpdateStatus = async (profile: Profile, type: 'access' | 'checkin', value: boolean) => {
        try {
            const updates: any = {};

            if (type === 'access') {
                const isBlocking = !value;
                updates.blocked = isBlocking;

                if (isBlocking) {
                    const subordinates = getSubordinatesRecursive(profile.id, profiles);
                    if (subordinates.length > 0) {
                        const subIds = subordinates.map(s => s.id);
                        const { error: subError } = await (supabase.from('profiles') as any).update({ blocked: true }).in('id', subIds);
                        if (!subError) toast.info(`Bloqueio de check-in aplicado para ${subordinates.length} subordinados.`);
                    }
                }
            } else if (type === 'checkin') {
                if (value) {
                    updates.active = 'ativado';
                    const now = new Date();
                    updates.checkin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                } else {
                    updates.active = 'desativado';
                    updates.checkin = null;
                }
            }

            const { error } = await (supabase.from('profiles') as any).update(updates).eq('id', profile.id);
            if (error) throw error;

            // Log
            if (type === 'checkin') {
                const logMsg = value
                    ? `CHECK-IN REMOTO: Gerente ${currentUser?.name} ativou ${profile.name}.`
                    : `CHECK-OUT REMOTO: Gerente ${currentUser?.name} desativou ${profile.name}.`;
                await (supabase as any).from('logs').insert({ level: 'INFO', message: logMsg, agency_id: currentUser?.agency_id || currentUser?.id, category: 'PONTO' });
            } else if (type === 'access') {
                const logMsg = value
                    ? `ACESSO LIBERADO: Gerente ${currentUser?.name} liberou check-in para ${profile.name}.`
                    : `ACESSO BLOQUEADO: Gerente ${currentUser?.name} bloqueou check-in para ${profile.name}.`;
                await (supabase as any).from('logs').insert({ level: 'INFO', message: logMsg, agency_id: currentUser?.agency_id || currentUser?.id, category: 'ACESSO' });
            }

            toast.success("Status atualizado!");
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (e: any) {
            toast.error("Erro ao atualizar: " + e.message);
        }
    };

    return {
        profiles, currentUser, viewMode, setViewMode,
        isAddModalOpen, setIsAddModalOpen,
        deleteModalOpen, setDeleteModalOpen, profileToDelete,
        editModalOpen, setEditModalOpen,
        editingMember, setEditingMember,
        newMember, setNewMember,
        validAgencies, handlePhoneChange,
        togglePermission, toggleAllPermissions,
        handleOpenEdit, isEffectivelyBlocked,
        canAssignRole,
        handleCreateMember, handleUpdateMember,
        confirmDelete, executeDelete,
        handleUpdateStatus,
    };
};
