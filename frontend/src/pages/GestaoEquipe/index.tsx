import { useGestaoEquipe } from './hooks/useGestaoEquipe';
import { HeaderEquipe } from './components/HeaderEquipe';
import { HierarchyNode, QueueView } from './components/ListaMembros';
import { ModalEditarMembro } from './components/ModalEditarMembro';
import { ModalConvidarMembro, ModalDeletarMembro } from './components/ModalConvidarMembro';

export default function GestaoEquipe() {
    const equipe = useGestaoEquipe();

    // Determine hierarchy roots for team view
    const roots = equipe.currentUser?.role === 'admin'
        ? equipe.profiles.filter(p => {
            if (p.role === 'admin') return false;
            if (p.role === 'imobiliaria' || (p.role as string) === 'imob') return true;
            if (p.agency_id === equipe.currentUser!.id) {
                return !p.director_id && !p.manager_id && !p.coordinator_id;
            }
            return !p.agency_id && !p.director_id && !p.manager_id && !p.coordinator_id;
        })
        : (equipe.currentUser ? [equipe.currentUser] : []);

    return (
        <div className="space-y-6 animate-fade-in">
            <HeaderEquipe
                viewMode={equipe.viewMode}
                setViewMode={equipe.setViewMode}
                onAddMember={() => equipe.setIsAddModalOpen(true)}
            />

            {/* Add Member Modal */}
            <ModalConvidarMembro
                open={equipe.isAddModalOpen}
                onOpenChange={equipe.setIsAddModalOpen}
                newMember={equipe.newMember}
                setNewMember={equipe.setNewMember}
                validAgencies={equipe.validAgencies}
                profiles={equipe.profiles}
                currentUser={equipe.currentUser}
                handlePhoneChange={equipe.handlePhoneChange}
                togglePermission={equipe.togglePermission}
                toggleAllPermissions={equipe.toggleAllPermissions}
                canAssignRole={equipe.canAssignRole}
                handleCreateMember={equipe.handleCreateMember}
            />

            {/* Delete Modal */}
            <ModalDeletarMembro
                open={equipe.deleteModalOpen}
                onOpenChange={equipe.setDeleteModalOpen}
                profileName={equipe.profileToDelete?.name || ''}
                onDelete={equipe.executeDelete}
            />

            {/* Edit Modal */}
            <ModalEditarMembro
                open={equipe.editModalOpen}
                onOpenChange={equipe.setEditModalOpen}
                editingMember={equipe.editingMember}
                setEditingMember={equipe.setEditingMember}
                validAgencies={equipe.validAgencies}
                profiles={equipe.profiles}
                currentUser={equipe.currentUser}
                handlePhoneChange={equipe.handlePhoneChange}
                togglePermission={equipe.togglePermission}
                toggleAllPermissions={equipe.toggleAllPermissions}
                canAssignRole={equipe.canAssignRole}
                handleUpdateMember={equipe.handleUpdateMember}
                confirmDelete={equipe.confirmDelete}
            />

            {/* Team View */}
            {equipe.viewMode === 'team' && (
                <div className="max-w-7xl mx-auto">
                    {roots.length === 0 ? (
                        <p className="text-muted-foreground p-4">Nenhum membro encontrado.</p>
                    ) : (
                        <div className="flex flex-wrap gap-6 items-start">
                            {roots.map(rootProfile => (
                                <HierarchyNode
                                    key={rootProfile.id}
                                    profile={rootProfile}
                                    allProfiles={equipe.profiles}
                                    level={0}
                                    onUpdateStatus={equipe.handleUpdateStatus}
                                    onOpenSettings={equipe.handleOpenEdit}
                                    isBlocked={equipe.isEffectivelyBlocked(rootProfile)}
                                    currentUser={equipe.currentUser}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Queue View */}
            {equipe.viewMode === 'queue' && (
                <QueueView
                    profiles={equipe.profiles}
                    currentUser={equipe.currentUser}
                    onUpdateStatus={equipe.handleUpdateStatus}
                    onOpenSettings={equipe.handleOpenEdit}
                />
            )}
        </div>
    );
}
