import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ROLE_CATEGORIES } from '../constantes';

export const useLogin = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Clear stale session on mount
    useEffect(() => {
        const clearSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    localStorage.removeItem('sb-access-token');
                    localStorage.removeItem('sb-refresh-token');
                }
                console.log('Login page loaded, ensuring clean state.');
            } catch (err) {
                console.error('Error in silent clear:', err);
            }
        };
        clearSession();
    }, []);

    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setError(null);
        setEmail('');
        setPassword('');
    };

    const handleBack = () => {
        setSelectedCategory(null);
        setError(null);
        setEmail('');
        setPassword('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;

        setIsLoading(true);
        setError(null);

        try {
            // Force clear any old session before signing in
            await supabase.auth.signOut();
            
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

            if (authError) {
                console.error('Auth Error:', authError);
                setError(authError.message.includes('Invalid login credentials') ? 'Email ou senha incorretos' : `Erro de autenticação: ${authError.message}`);
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                setError('Usuário não encontrado');
                setIsLoading(false);
                return;
            }

            const { data: profile, error: profileError } = await (supabase.from('profiles').select('*').eq('id', authData.user.id).single() as any);

            if (profileError || !profile) {
                setError('Perfil não encontrado');
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            // ensure the auth token contains the user's agency_id (used by RLS policies)
            // the profile row is the source of truth, so sync it into user_metadata on every login
            if (profile.agency_id) {
                try {
                    console.log('[LOGIN] Syncing agency_id to auth:', profile.agency_id);
                    await supabase.auth.updateUser({ data: { agency_id: profile.agency_id } });
                    // Refresh the session to regenerate the JWT with the new claim
                    await supabase.auth.refreshSession();
                    console.log('[LOGIN] Session refreshed with new agency_id claim');
                } catch (err) {
                    // non-fatal: if this fails the user will still be able to log in, but
                    // policies that rely on the claim may not immediately work until the
                    // user signs out and back in again.
                    console.error('[LOGIN] Failed to sync agency_id into auth metadata:', err);
                }
            }


            const category = ROLE_CATEGORIES.find(c => c.id === selectedCategory);
            if (!category) {
                setError('Categoria inválida');
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            const userRole = profile.role?.toLowerCase();
            if (!category.roles.includes(userRole)) {
                setError(`Acesso negado. Você é "${profile.role}", escolha a categoria correta.`);
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            // Log successful login
            await (supabase as any).from('logs').insert({
                level: 'SUCCESS',
                message: `LOGIN [Usuário: ${profile.name}]: Entrou no sistema como ${profile.role}.`,
                agency_id: profile.agency_id || profile.id,
                category: 'ACESSO'
            });

            // Invalidate + refetch to get full profile with parsed permissions
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            await queryClient.refetchQueries({ queryKey: ['currentUser'] });

            navigate('/', { replace: true });
        } catch (err: any) {
            console.error('Critical Login Error:', err);
            setError('Erro ao fazer login. Tente novamente.');
            setIsLoading(false);
        }
    };

    return {
        selectedCategory,
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        isLoading,
        error,
        handleSelectCategory,
        handleBack,
        handleLogin,
    };
};
