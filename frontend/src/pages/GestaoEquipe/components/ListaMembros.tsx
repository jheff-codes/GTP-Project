import { useState } from 'react';
import { Settings, Shield, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/database.types';
import { getRoleGradient, getRoleLabel } from '../constantes';

// TeamCard Component
export function TeamCard({ profile, onUpdateStatus, onOpenSettings, isBlocked, hideControls = false, currentUser }: {
    profile: Profile;
    onUpdateStatus: (p: Profile, type: 'access' | 'checkin', val: boolean) => void;
    onOpenSettings: (p: Profile) => void;
    isBlocked: boolean;
    hideControls?: boolean;
    currentUser: Profile | null;
}) {
    const isBroker = profile.role === 'broker' || (profile.role as string) === 'corretor';
    const isDirectlyBlocked = profile.blocked === true;
    const isAccessOn = !isDirectlyBlocked;
    const isActive = profile.active === 'ativado';
    const checkinTime = profile.checkin ? new Date(profile.checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group",
            isBlocked && "opacity-60 grayscale"
        )}>
            <div className={cn("h-1 w-full bg-gradient-to-r", getRoleGradient(profile.role))} />
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-foreground/70 font-bold text-sm">{initials}</span>
                        <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card", isActive ? "bg-emerald-500" : "bg-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted">
                            {getRoleLabel(profile.role)}
                        </span>
                        <h3 className="font-bold text-foreground tracking-tight leading-tight line-clamp-1 text-sm mt-1" title={profile.name}>{profile.name}</h3>
                        <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    {!hideControls && currentUser && currentUser.id !== profile.id && (
                        (currentUser.role === 'admin') ||
                        ((currentUser as any).parsedPermissions?.team?.manage_member &&
                            ((currentUser.role === 'imobiliaria' || (currentUser.role as string) === 'imob') ||
                                (currentUser.role === 'director' && ['manager', 'coordinator', 'broker', 'corretor'].includes(profile.role)) ||
                                (currentUser.role === 'manager' && ['coordinator', 'broker', 'corretor'].includes(profile.role)) ||
                                (currentUser.role === 'coordinator' && ['broker', 'corretor'].includes(profile.role))))
                    ) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted" onClick={(e) => { e.stopPropagation(); onOpenSettings(profile); }}>
                                <Settings className="w-4 h-4" />
                            </Button>
                        )}
                </div>

                {!hideControls && (
                    <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                        {isBroker && (
                            <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className={cn("p-1.5 rounded-lg", isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground")}>
                                        <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide">Check-in</p>
                                        <p className="text-[9px] text-muted-foreground">{isActive ? checkinTime : 'Offline'}</p>
                                    </div>
                                </div>
                                <Switch checked={isActive} onCheckedChange={(val) => onUpdateStatus(profile, 'checkin', val)} disabled={isBlocked || isDirectlyBlocked} className="data-[state=checked]:bg-emerald-500" />
                            </div>
                        )}
                        <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-lg", isAccessOn ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive")}>
                                    <Shield className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide">Acesso ao Sistema</p>
                                    <p className="text-[9px] text-muted-foreground">{isAccessOn ? 'Liberado' : 'Bloqueado'}</p>
                                </div>
                            </div>
                            <Switch checked={isAccessOn} onCheckedChange={(val) => onUpdateStatus(profile, 'access', val)} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                    </div>
                )}
            </div>

            {isBlocked && isAccessOn && (
                <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg">Bloqueio Superior</div>
                </div>
            )}
        </div>
    );
}

// HierarchyNode Component
export function HierarchyNode({ profile, allProfiles, level, onUpdateStatus, onOpenSettings, isBlocked, currentUser }: {
    profile: Profile; allProfiles: Profile[]; level: number;
    onUpdateStatus: any; onOpenSettings: any; isBlocked: boolean; currentUser: Profile | null;
}) {
    const [expanded, setExpanded] = useState(false);

    let children: Profile[] = [];
    const isImob = profile.role === 'imobiliaria' || (profile.role as string) === 'imob';

    if (isImob) {
        const agencyId = profile.id;
        children = allProfiles.filter(p =>
            p.agency_id === agencyId && p.id !== agencyId &&
            (p.role === 'director' || (p.role === 'manager' && !p.director_id) ||
                (p.role === 'coordinator' && !p.director_id && !p.manager_id) ||
                ((p.role === 'broker' || (p.role as string) === 'corretor') && !p.director_id && !p.manager_id && !p.coordinator_id))
        );
    } else if (profile.role === 'director') {
        children = allProfiles.filter(p => p.director_id === profile.id &&
            (p.role === 'manager' || (p.role === 'coordinator' && !p.manager_id) ||
                ((p.role === 'broker' || (p.role as string) === 'corretor') && !p.manager_id && !p.coordinator_id)));
    } else if (profile.role === 'manager') {
        children = allProfiles.filter(p => p.manager_id === profile.id && (p.role === 'coordinator' || ((p.role === 'broker' || (p.role as string) === 'corretor') && !p.coordinator_id)));
    } else if (profile.role === 'coordinator') {
        children = allProfiles.filter(p => p.coordinator_id === profile.id && (p.role === 'broker' || (p.role as string) === 'corretor'));
    }

    const hasChildren = children.length > 0;

    return (
        <div className={cn("relative transition-all duration-300 ease-in-out", expanded ? "w-full ring-2 ring-primary/10 rounded-2xl bg-muted/20 p-4" : "w-full md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)]")}>
            <div className="relative">
                <div className={cn("absolute -left-3 top-6 p-1 rounded-full cursor-pointer hover:bg-primary/20 text-primary transition-colors z-20 flex items-center justify-center bg-background shadow-sm border border-border", !hasChildren && "hidden")} onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <div onClick={() => hasChildren && setExpanded(!expanded)} className={cn("cursor-pointer", !hasChildren && "cursor-default")}>
                    <TeamCard profile={profile} onUpdateStatus={onUpdateStatus} onOpenSettings={onOpenSettings} isBlocked={isBlocked} currentUser={currentUser} />
                </div>
            </div>

            {expanded && hasChildren && (
                <div className="mt-6 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                        <div className="h-px bg-border flex-1" /><span>Subordinados ({children.length})</span><div className="h-px bg-border flex-1" />
                    </div>
                    <div className="flex flex-wrap gap-4 items-start">
                        {children.map(child => (
                            <HierarchyNode key={child.id} profile={child} allProfiles={allProfiles} level={level + 1} onUpdateStatus={onUpdateStatus} onOpenSettings={onOpenSettings} isBlocked={isBlocked || child.blocked || false} currentUser={currentUser} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// QueueView Component
export function QueueView({ profiles, currentUser, onUpdateStatus, onOpenSettings }: {
    profiles: Profile[]; currentUser: Profile | null; onUpdateStatus: any; onOpenSettings: any;
}) {
    const [expandedAgency, setExpandedAgency] = useState<string | null>(null);

    const agencies = profiles.filter(p =>
        p.role === 'imobiliaria' || (p.role as string) === 'imob' ||
        (p.role === 'admin' && profiles.some(sub => sub.agency_id === p.id))
    );
    const displayAgencies = agencies.length > 0 ? agencies : profiles.filter(p => p.role === 'admin');

    const getAgencyBrokers = (agencyId: string) => {
        return profiles.filter(p => {
            const isBroker = p.role === 'broker' || (p.role as string) === 'corretor';
            if (!isBroker) return false;
            return p.agency_id === agencyId || p.director_id === agencyId || p.manager_id === agencyId || p.coordinator_id === agencyId;
        }).sort((a, b) => {
            const aActive = a.active === 'ativado';
            const bActive = b.active === 'ativado';
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            if (!aActive && !bActive) return 0;
            const timeA = a.checkin || '99:99:99';
            const timeB = b.checkin || '99:99:99';
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;
            return 0;
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-center text-xl font-black uppercase tracking-tight text-muted-foreground mb-8">Fila de Atendimento</h2>
            <div className="flex flex-wrap gap-6 justify-center">
                {displayAgencies.map(agency => (
                    <div key={agency.id} className="w-full md:w-[350px]">
                        <div className={cn("cursor-pointer transition-all duration-300", expandedAgency === agency.id ? "ring-2 ring-primary scale-[1.02]" : "hover:scale-[1.02]")} onClick={() => setExpandedAgency(expandedAgency === agency.id ? null : agency.id)}>
                            <TeamCard profile={agency} onUpdateStatus={onUpdateStatus} onOpenSettings={onOpenSettings} isBlocked={agency.blocked || false} hideControls={true} currentUser={currentUser} />
                        </div>
                    </div>
                ))}
            </div>

            {expandedAgency && (
                <div className="animate-in fade-in slide-in-from-top-4 mt-8 bg-muted/30 rounded-[2rem] p-8 border border-border/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                            Fila de Corretores
                        </h3>
                        <Badge variant="outline" className="font-mono">{getAgencyBrokers(expandedAgency).length} Membros</Badge>
                    </div>
                    <div className="space-y-2">
                        {getAgencyBrokers(expandedAgency).map((broker, index) => {
                            const isActive = broker.active === 'ativado';
                            const checkinTime = broker.checkin || '--:--';
                            return (
                                <div key={broker.id} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent opacity-50" />
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner transition-all", isActive ? "bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-500/20" : "bg-muted text-muted-foreground")}>
                                            {isActive ? `#${index + 1}` : '-'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{broker.name}</h4>
                                            <p className="text-xs text-muted-foreground">{broker.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isActive ? (
                                            <div className="text-right">
                                                <span className="block text-[10px] font-bold uppercase text-muted-foreground">Check-in</span>
                                                <span className="font-mono text-lg font-bold text-emerald-500">{checkinTime}</span>
                                            </div>
                                        ) : (
                                            <Badge variant="secondary" className="uppercase text-[10px] bg-red-100 text-red-700 hover:bg-red-200 border-none">Offline</Badge>
                                        )}
                                        <Button size="sm" variant={isActive ? "destructive" : "default"} onClick={() => onUpdateStatus(broker, 'checkin', !isActive)} className="text-xs">
                                            {isActive ? 'Check-out' : 'Check-in'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {getAgencyBrokers(expandedAgency).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">Nenhum corretor nesta agência.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
