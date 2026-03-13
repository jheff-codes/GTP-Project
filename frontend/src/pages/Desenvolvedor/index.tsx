import { useEffect } from 'react';
import { useDesenvolvedor } from './hooks/useDesenvolvedor';
import { useAutomacaoConfig } from './hooks/useAutomacaoConfig';
import { useLogs } from './hooks/useLogs';

import { HeaderDesenvolvedor } from './components/HeaderDesenvolvedor';
import { SidebarConfig } from './components/SidebarConfig';
import { SidebarLogs } from './components/SidebarLogs';
import { ControleAutomacao } from './components/ControleAutomacao';
import { ConsoleLogs } from './components/ConsoleLogs';

import { PainelCorretores } from './components/GestaoCorretores/PainelCorretores';
import { PainelEstagnados } from './components/GestaoEstagnados/PainelEstagnados';
import { PainelDisparador } from './components/DisparadorMensagens/PainelDisparador';
import { PainelAlertas } from './components/AlertasErro/PainelAlertas';

export default function Desenvolvedor() {
    const {
        currentUser,
        activeAutomation,
        selectAutomation,
        viewMode,
        setViewMode,
        showErrorAlertPanel,
        setShowErrorAlertPanel,
        isGlobal,
        setIsGlobal,
        selectedAgency,
        setSelectedAgency,
        logAgencyFilter,
        setLogAgencyFilter,
        activeLogCategory,
        setActiveLogCategory,
        agencies,
    } = useDesenvolvedor();

    const {
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
    } = useAutomacaoConfig({
        currentUser,
        activeAutomation,
        isGlobal,
        selectedAgency,
    });

    const {
        logs,
        totalLogs,
        searchQuery,
        currentSearchIndex,
        handleSearchChange,
        handleSearchPrev,
        handleSearchNext,
    } = useLogs({
        currentUser,
        logAgencyFilter,
        activeLogCategory,
    });

    // Load error alert config when panel opens
    useEffect(() => {
        if (showErrorAlertPanel) loadErrorAlertConfig();
    }, [showErrorAlertPanel, loadErrorAlertConfig]);

    const renderActivePanel = () => {
        if (!config) return null;
        switch (activeAutomation) {
            case 'broker_management':
                return <PainelCorretores config={config} setConfig={setConfig} />;
            case 'stalled_clients_distribution':
                return <PainelEstagnados config={config} setConfig={setConfig} />;
            case 'message_dispatch':
                return <PainelDisparador config={config} setConfig={setConfig} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-slate-200 p-4 md:p-8 animate-fade-in space-y-8">
            <HeaderDesenvolvedor
                viewMode={viewMode}
                setViewMode={setViewMode}
                isGlobal={isGlobal}
                setIsGlobal={setIsGlobal}
            />

            <div className="grid grid-cols-12 gap-8">
                {viewMode === 'config' ? (
                    <>
                        <SidebarConfig
                            activeAutomation={activeAutomation}
                            onSelectAutomation={selectAutomation}
                            showErrorAlertPanel={showErrorAlertPanel}
                            onToggleErrorAlerts={() => setShowErrorAlertPanel(!showErrorAlertPanel)}
                        />
                        <main className="col-span-12 lg:col-span-10">
                            {showErrorAlertPanel ? (
                                <PainelAlertas
                                    errorAlertConfig={errorAlertConfig}
                                    setErrorAlertConfig={setErrorAlertConfig}
                                    onSave={handleSaveErrorAlert}
                                    saving={savingErrorAlert}
                                />
                            ) : (
                                <div className="grid grid-cols-12 gap-8 h-full">
                                    <ControleAutomacao
                                        config={config}
                                        configScope={configScope}
                                        loading={loading}
                                        saving={saving}
                                        progressData={progressData}
                                        instanceProgress={instanceProgress}
                                        activeAutomation={activeAutomation}
                                        isGlobal={isGlobal}
                                        selectedAgency={selectedAgency}
                                        agencies={agencies}
                                        setSelectedAgency={setSelectedAgency}
                                        setConfig={setConfig}
                                        onSave={handleSave}
                                        onReset={handleResetConfig}
                                        onToggleStatus={handleToggleStatus}
                                    >
                                        {renderActivePanel()}
                                    </ControleAutomacao>
                                </div>
                            )}
                        </main>
                    </>
                ) : (
                    <>
                        <SidebarLogs
                            activeLogCategory={activeLogCategory}
                            setActiveLogCategory={setActiveLogCategory}
                        />
                        <main className="col-span-12 lg:col-span-10">
                            <ConsoleLogs
                                logs={logs}
                                totalLogs={totalLogs}
                                searchQuery={searchQuery}
                                currentSearchIndex={currentSearchIndex}
                                onSearchChange={handleSearchChange}
                                onSearchPrev={handleSearchPrev}
                                onSearchNext={handleSearchNext}
                                logAgencyFilter={logAgencyFilter}
                                setLogAgencyFilter={setLogAgencyFilter}
                                agencies={agencies}
                            />
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}
