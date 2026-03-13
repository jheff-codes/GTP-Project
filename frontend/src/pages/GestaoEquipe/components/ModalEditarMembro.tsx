import { User, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/database.types';
import { PERMISSIONS_SCHEMA, AVAILABLE_ROLES, getRoleLabel } from '../constantes';

interface ModalEditarMembroProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingMember: any;
    setEditingMember: (v: any) => void;
    validAgencies: Profile[];
    profiles: Profile[];
    currentUser: any;
    handlePhoneChange: (v: string, isEditing: boolean) => void;
    togglePermission: (section: string, action: string, isEditing: boolean) => void;
    toggleAllPermissions: (sectionId: string, isEditing: boolean) => void;
    canAssignRole: (role: string) => boolean;
    handleUpdateMember: () => void;
    confirmDelete: (profile: Profile) => void;
}

export const ModalEditarMembro = ({
    open, onOpenChange, editingMember, setEditingMember,
    validAgencies, profiles, currentUser,
    handlePhoneChange, togglePermission, toggleAllPermissions,
    canAssignRole, handleUpdateMember, confirmDelete,
}: ModalEditarMembroProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Membro: {editingMember.name}</DialogTitle>
                    <DialogDescription>Atualize os dados e permissões deste usuário.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    {/* Left Column: Personal Data */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                            <User className="w-5 h-5" /> Dados Pessoais
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Nome</Label><Input value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} placeholder="Nome completo" /></div>
                            <div className="space-y-2 col-span-2">
                                <Label>Email</Label>
                                <Input value={editingMember.email} onChange={e => setEditingMember({ ...editingMember, email: e.target.value })} placeholder="email@exemplo.com" disabled={currentUser?.role !== 'admin'} className={cn(currentUser?.role !== 'admin' && "opacity-60 bg-muted")} />
                                {currentUser?.role !== 'admin' && <p className="text-[10px] text-muted-foreground">Apenas admin pode alterar o email.</p>}
                            </div>
                            <div className="space-y-2"><Label>Telefone</Label><Input value={editingMember.phone} onChange={e => handlePhoneChange(e.target.value, true)} placeholder="(00) 00000-0000" maxLength={15} /></div>
                            <div className="space-y-2"><Label>Senha (Opcional)</Label><Input type="password" value={editingMember.password} onChange={e => setEditingMember({ ...editingMember, password: e.target.value })} placeholder="Nova senha (vazio para manter)" /></div>
                        </div>

                        {currentUser?.id !== editingMember.id && !['imobiliaria', 'imob'].includes(editingMember.role || '') && (
                            <div className="space-y-2">
                                <Label>Função</Label>
                                <Select value={editingMember.role || ''} onValueChange={(v: any) => setEditingMember({ ...editingMember, role: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ROLES.filter(r => canAssignRole(r) && r !== 'imobiliaria').map(role => (
                                            <SelectItem key={role} value={role}>{getRoleLabel(role)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {(currentUser?.id === editingMember.id || ['imobiliaria', 'imob'].includes(editingMember.role || '')) && (
                            <div className="space-y-2">
                                <Label>Função</Label>
                                <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                                    {getRoleLabel(editingMember.role)} <span className="text-muted-foreground text-xs">(não editável)</span>
                                </div>
                            </div>
                        )}

                        {currentUser?.role === 'admin' && (
                            <div className="space-y-2">
                                <Label>Agência (Imobiliária)</Label>
                                <Select value={editingMember.agency_id} onValueChange={v => {
                                    const ag = validAgencies.find(a => a.id === v);
                                    setEditingMember({ ...editingMember, agency_id: v, prefix: ag?.prefix || editingMember.prefix });
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {validAgencies.map(a => (<SelectItem key={a.id} value={a.id}>{a.name} {a.role === 'admin' ? '(Sistema)' : ''}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Cascading Supervisors */}
                        {editingMember.agency_id && (
                            <>
                                {['manager', 'coordinator', 'broker', 'corretor'].includes(editingMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Diretor Responsável</Label>
                                        <Select value={editingMember.director_id || "none"} onValueChange={v => setEditingMember({ ...editingMember, director_id: v === "none" ? "" : v, manager_id: "", coordinator_id: "" })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (Reporta à Imobiliária)</SelectItem>
                                                {profiles.filter(p => p.role === 'director' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : editingMember.agency_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {['coordinator', 'broker', 'corretor'].includes(editingMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Gerente Responsável</Label>
                                        <Select value={editingMember.manager_id || "none"} onValueChange={v => setEditingMember({ ...editingMember, manager_id: v === "none" ? "" : v, coordinator_id: "" })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum {editingMember.director_id ? "(Reporta ao Diretor)" : "(Reporta à Imobiliária)"}</SelectItem>
                                                {profiles.filter(p => p.role === 'manager' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : editingMember.agency_id) && (!editingMember.director_id || p.director_id === editingMember.director_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {['broker', 'corretor'].includes(editingMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Coordenador Responsável</Label>
                                        <Select value={editingMember.coordinator_id || "none"} onValueChange={v => setEditingMember({ ...editingMember, coordinator_id: v === "none" ? "" : v })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum {editingMember.manager_id ? "(Reporta ao Gerente)" : (editingMember.director_id ? "(Reporta ao Diretor)" : "(Reporta à Imobiliária)")}</SelectItem>
                                                {profiles.filter(p => p.role === 'coordinator' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : editingMember.agency_id) && (!editingMember.manager_id || p.manager_id === editingMember.manager_id) && (!editingMember.director_id || p.director_id === editingMember.director_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {(editingMember.role === 'imobiliaria' || (editingMember.role as string) === 'imob') && (
                            <>
                                <div className="space-y-2"><Label>Endereço</Label><Input value={editingMember.address || ''} onChange={e => setEditingMember({ ...editingMember, address: e.target.value })} placeholder="Endereço completo" /></div>
                                <div className="space-y-2"><Label>CRECI</Label><Input value={editingMember.creci || ''} onChange={e => setEditingMember({ ...editingMember, creci: e.target.value })} placeholder="00000-J" /></div>
                            </>
                        )}
                        <div className="space-y-2"><Label>Prefixo</Label><Input value={editingMember.prefix} onChange={e => setEditingMember({ ...editingMember, prefix: e.target.value })} placeholder="Ex: SP" /></div>
                        <div className="space-y-2"><Label>Nome da Instância (UAZAPI)</Label><Input value={editingMember.instance_name || ''} onChange={e => setEditingMember({ ...editingMember, instance_name: e.target.value })} placeholder="Ex: Minha Instância" /></div>

                        <div className="p-4 border rounded-lg bg-destructive/10 mt-4">
                            <h4 className="font-bold text-destructive mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Zona de Perigo</h4>
                            <Button variant="destructive" className="w-full gap-2" onClick={() => {
                                const prof = profiles.find(p => p.id === editingMember.id);
                                if (prof) confirmDelete(prof);
                            }}>Excluir Usuário</Button>
                        </div>
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="space-y-4 border-l pl-0 lg:pl-8 border-border/50">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2"><Shield className="w-5 h-5" /> Permissões de Acesso</h3>
                        <p className="text-xs text-muted-foreground mb-4">Selecione o que este usuário pode visualizar ou gerenciar no sistema.</p>
                        <div className="space-y-4">
                            {PERMISSIONS_SCHEMA.map((section) => {
                                const allSelected = section.actions.every(action => editingMember.permissions[section.id]?.[action.id]);
                                const someSelected = section.actions.some(action => editingMember.permissions[section.id]?.[action.id]);
                                return (
                                    <div key={section.id} className="p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-card hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Checkbox id={`edit-perm-all-${section.id}`} checked={allSelected} onCheckedChange={() => toggleAllPermissions(section.id, true)} className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""} />
                                            <Label htmlFor={`edit-perm-all-${section.id}`} className={cn("font-bold uppercase tracking-widest text-xs cursor-pointer", allSelected ? "text-primary" : "text-muted-foreground")}>{section.label}</Label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pl-6">
                                            {section.actions.map((action) => {
                                                const isChecked = editingMember.permissions[section.id]?.[action.id] || false;
                                                return (
                                                    <div key={action.id} className="flex items-center space-x-2">
                                                        <Checkbox id={`edit-perm-${section.id}-${action.id}`} checked={isChecked} onCheckedChange={() => togglePermission(section.id, action.id, true)} />
                                                        <Label htmlFor={`edit-perm-${section.id}-${action.id}`} className={cn("text-xs cursor-pointer", isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>{action.label}</Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button onClick={handleUpdateMember} className="w-full md:w-auto font-bold uppercase tracking-wider">Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
