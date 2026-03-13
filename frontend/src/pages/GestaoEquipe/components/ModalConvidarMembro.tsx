import { User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/database.types';
import { PERMISSIONS_SCHEMA, AVAILABLE_ROLES, getRoleLabel } from '../constantes';

interface ModalConvidarMembroProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    newMember: any;
    setNewMember: (v: any) => void;
    validAgencies: Profile[];
    profiles: Profile[];
    currentUser: any;
    handlePhoneChange: (v: string, isEditing: boolean) => void;
    togglePermission: (section: string, action: string, isEditing: boolean) => void;
    toggleAllPermissions: (sectionId: string, isEditing: boolean) => void;
    canAssignRole: (role: string) => boolean;
    handleCreateMember: () => void;
}

// Delete Confirmation Modal
export const ModalDeletarMembro = ({ open, onOpenChange, profileName, onDelete }: {
    open: boolean; onOpenChange: (v: boolean) => void; profileName: string; onDelete: () => void;
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Excluir Usuário</DialogTitle>
                <DialogDescription>Confirma a exclusão de {profileName}?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={onDelete}>Excluir</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export const ModalConvidarMembro = ({
    open, onOpenChange, newMember, setNewMember,
    validAgencies, profiles, currentUser,
    handlePhoneChange, togglePermission, toggleAllPermissions,
    canAssignRole, handleCreateMember,
}: ModalConvidarMembroProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Membro</DialogTitle>
                    <DialogDescription>Configure os dados e permissões do novo membro.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    {/* Left Column: Personal Data */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                            <User className="w-5 h-5" /> Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Nome</Label><Input value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Nome completo" /></div>
                            <div className="space-y-2 col-span-2"><Label>Email</Label><Input value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div className="space-y-2"><Label>Telefone</Label><Input value={newMember.phone} onChange={e => handlePhoneChange(e.target.value, false)} placeholder="(00) 00000-0000" maxLength={15} /></div>
                            <div className="space-y-2"><Label>Senha</Label><Input type="password" value={newMember.password} onChange={e => setNewMember({ ...newMember, password: e.target.value })} placeholder="******" /></div>
                        </div>

                        <div className="space-y-2">
                            <Label>Função</Label>
                            <Select value={newMember.role || ''} onValueChange={(v: any) => setNewMember({ ...newMember, role: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_ROLES.filter(r => canAssignRole(r)).map(role => (
                                        <SelectItem key={role} value={role}>{getRoleLabel(role)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(currentUser?.role !== 'imobiliaria' && (currentUser?.role as string) !== 'imob') &&
                            (newMember.role !== 'imobiliaria' && newMember.role !== 'admin' && (newMember.role as string) !== 'imob') && (
                                <div className="space-y-2">
                                    <Label>Agência (Imobiliária)</Label>
                                    <Select value={newMember.agency_id} onValueChange={v => {
                                        const ag = validAgencies.find(a => a.id === v);
                                        setNewMember({ ...newMember, agency_id: v, prefix: ag?.prefix || newMember.prefix });
                                    }}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {validAgencies.map(a => (<SelectItem key={a.id} value={a.id}>{a.name} {a.role === 'admin' ? '(Sistema)' : ''}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                        {/* Cascading Supervisors */}
                        {newMember.agency_id && (
                            <>
                                {['manager', 'coordinator', 'broker', 'corretor'].includes(newMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Diretor Responsável</Label>
                                        <Select value={newMember.director_id || "none"} onValueChange={v => setNewMember({ ...newMember, director_id: v === "none" ? "" : v, manager_id: "", coordinator_id: "" })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (Reporta à Imobiliária)</SelectItem>
                                                {profiles.filter(p => p.role === 'director' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : newMember.agency_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {['coordinator', 'broker', 'corretor'].includes(newMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Gerente Responsável</Label>
                                        <Select value={newMember.manager_id || "none"} onValueChange={v => setNewMember({ ...newMember, manager_id: v === "none" ? "" : v, coordinator_id: "" })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum {newMember.director_id ? "(Reporta ao Diretor)" : "(Reporta à Imobiliária)"}</SelectItem>
                                                {profiles.filter(p => p.role === 'manager' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : newMember.agency_id) && (!newMember.director_id || p.director_id === newMember.director_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {['broker', 'corretor'].includes(newMember.role) && (
                                    <div className="space-y-2">
                                        <Label>Coordenador Responsável</Label>
                                        <Select value={newMember.coordinator_id || "none"} onValueChange={v => setNewMember({ ...newMember, coordinator_id: v === "none" ? "" : v })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum {newMember.manager_id ? "(Reporta ao Gerente)" : (newMember.director_id ? "(Reporta ao Diretor)" : "(Reporta à Imobiliária)")}</SelectItem>
                                                {profiles.filter(p => p.role === 'coordinator' && p.agency_id === ((currentUser?.role === 'imobiliaria' || (currentUser?.role as string) === 'imob') ? currentUser.id : newMember.agency_id) && (!newMember.manager_id || p.manager_id === newMember.manager_id) && (!newMember.director_id || p.director_id === newMember.director_id)).map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {(newMember.role === 'imobiliaria' || (newMember.role as string) === 'imob') && (
                            <>
                                <div className="space-y-2"><Label>Endereço</Label><Input value={newMember.address || ''} onChange={e => setNewMember({ ...newMember, address: e.target.value })} placeholder="Endereço completo" /></div>
                                <div className="space-y-2"><Label>CRECI</Label><Input value={newMember.creci || ''} onChange={e => setNewMember({ ...newMember, creci: e.target.value })} placeholder="00000-J" /></div>
                            </>
                        )}
                        <div className="space-y-2"><Label>Prefixo</Label><Input value={newMember.prefix} onChange={e => setNewMember({ ...newMember, prefix: e.target.value })} placeholder="Ex: SP" /></div>
                        <div className="space-y-2"><Label>Nome da Instância (UAZAPI)</Label><Input value={newMember.instance_name || ''} onChange={e => setNewMember({ ...newMember, instance_name: e.target.value })} placeholder="Ex: Minha Instância" /></div>
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="space-y-4 border-l pl-0 lg:pl-8 border-border/50">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2"><Shield className="w-5 h-5" /> Permissões de Acesso</h3>
                        <p className="text-xs text-muted-foreground mb-4">Selecione o que este usuário pode visualizar ou gerenciar no sistema.</p>
                        <div className="space-y-4">
                            {PERMISSIONS_SCHEMA.map((section) => {
                                const allSelected = section.actions.every(action => newMember.permissions[section.id]?.[action.id]);
                                const someSelected = section.actions.some(action => newMember.permissions[section.id]?.[action.id]);
                                return (
                                    <div key={section.id} className="p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-card hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Checkbox id={`perm-all-${section.id}`} checked={allSelected} onCheckedChange={() => toggleAllPermissions(section.id, false)}
                                                className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                                disabled={currentUser?.role !== 'admin' && !currentUser?.parsedPermissions?.[section.id]} />
                                            <Label htmlFor={`perm-all-${section.id}`} className={cn("font-bold uppercase tracking-widest text-xs cursor-pointer", allSelected ? "text-primary" : "text-muted-foreground")}>{section.label}</Label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pl-6">
                                            {section.actions.map((action) => {
                                                const isChecked = newMember.permissions[section.id]?.[action.id] || false;
                                                const canGrant = currentUser?.role === 'admin' || currentUser?.parsedPermissions?.[section.id]?.[action.id] === true;
                                                return (
                                                    <div key={action.id} className="flex items-center space-x-2">
                                                        <Checkbox id={`perm-${section.id}-${action.id}`} checked={isChecked} onCheckedChange={() => togglePermission(section.id, action.id, false)} disabled={!canGrant} />
                                                        <Label htmlFor={`perm-${section.id}-${action.id}`} className={cn("text-xs cursor-pointer", isChecked ? "text-foreground font-medium" : "text-muted-foreground", !canGrant && "opacity-50 cursor-not-allowed")}>{action.label}</Label>
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
                    <Button onClick={handleCreateMember} className="w-full md:w-auto font-bold uppercase tracking-wider">Criar Acesso</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
