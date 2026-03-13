import { Bell } from 'lucide-react';
import { useConfiguracoes } from './hooks/useConfiguracoes';
import { HeaderConfiguracoes } from './components/HeaderConfiguracoes';
import { InfoImobiliaria } from './components/InfoImobiliaria';
import { ControleIP } from './components/ControleIP';
import { DadosEmpresa } from './components/DadosEmpresa';
import { PerfilUsuario } from './components/PerfilUsuario';
import { AlterarSenha } from './components/AlterarSenha';

const Configuracoes = () => {
    const {
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
        fetchMyIp,
        handleAvatarUpload,
    } = useConfiguracoes();

    if (loading && !currentUser) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl pb-10">
            <HeaderConfiguracoes />

            {/* Info da Imobiliária (read-only) */}
            {(isImobiliaria || currentUser?.agency_id) && (
                <InfoImobiliaria
                    agencyId={isImobiliaria ? (currentUser?.id || '') : (currentUser?.agency_id || '')}
                    profiles={profiles}
                    compact={isImobiliaria}
                />
            )}

            {/* Controle de IP - apenas admin/imob */}
            {isImobiliaria && (
                <ControleIP
                    config={config}
                    setConfig={setConfig}
                    loading={loading}
                    onSave={handleSaveIpConfig}
                    toggleDay={toggleDay}
                    fetchMyIp={fetchMyIp}
                />
            )}

            {/* Dados da Empresa - apenas admin/imob */}
            {isImobiliaria && (
                <DadosEmpresa
                    formData={formData}
                    setFormData={setFormData}
                    config={config}
                    setConfig={setConfig}
                    loading={loading}
                    onSave={handleSaveProfile}
                    currentUser={currentUser}
                />
            )}

            {/* Perfil do Usuário */}
            <PerfilUsuario
                formData={formData}
                setFormData={setFormData}
                currentUser={currentUser}
                loading={loading}
                onSave={handleSaveProfile}
                isImobiliaria={isImobiliaria}
                onAvatarChange={handleAvatarUpload}
            />

            {/* Alterar Senha */}
            <AlterarSenha
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                onSave={handlePasswordChange}
            />

            {/* Notificações - placeholder */}
            <div className="gtp-card">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-black">Notificações</h2>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">As notificações do sistema já estão ativas e vinculadas ao seu usuário.</p>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
