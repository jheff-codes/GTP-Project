import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  Power,
  Terminal,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];



interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

import { useQueryClient } from '@tanstack/react-query';

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, refetch } = useCurrentUser();
  // We can use a helper or accessing currentUser directly
  const hasPermission = (section: string, action: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perms = currentUser.parsedPermissions?.[section as keyof typeof currentUser.parsedPermissions];
    if (!perms) return false;
    return (perms as Record<string, boolean>)[action] === true;
  };

  const canViewTeam = hasPermission('team', 'view_team');
  const canViewLeads = hasPermission('clients', 'view_kanban') || hasPermission('clients', 'view_list');
  const canViewProperties = hasPermission('properties', 'view');
  const canViewCalendar = hasPermission('calendar', 'view_month') || hasPermission('calendar', 'view_week') || hasPermission('calendar', 'view_day') || hasPermission('calendar', 'create');

  const [checkingIn, setCheckingIn] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', visible: true },
    { path: '/leads', icon: Users, label: 'Clientes', visible: canViewLeads },
    { path: '/properties', icon: Building2, label: 'Imóveis', visible: canViewProperties },
    { path: '/agenda', icon: CalendarDays, label: 'Agenda', visible: canViewCalendar },
    { path: '/team', icon: Users, label: 'Gestão de Equipes', visible: canViewTeam },
    { path: '/disparos', icon: Rocket, label: 'Disparos', visible: hasPermission('disparos', 'ver_disparos') },
    { path: '/development', icon: Terminal, label: 'Desenvolvimento', visible: currentUser?.role === 'admin' },
  ].filter(item => item.visible);

  const handleCheckInToggle = async () => {
    try {
      setCheckingIn(true);
      if (!currentUser) return;

      // 1. Buscar Configurações da Agência
      const { data: configData } = await supabase
        .from('profiles')
        .select('checkin_start, checkin_end, checkin_window_minutes, checkin_days, allowed_ips, require_ip_check, access_schedules, ip_required_days, prefix')
        .eq('id', currentUser.agency_id || currentUser.id)
        .single();

      const config = configData as any;

      const isCurrentlyActive = currentUser.active === 'ativado';
      const newState = !isCurrentlyActive;
      let currentIp = '0.0.0.0';

      // 2. Verificações de Regra apenas para CHECK-IN (entrada)
      if (newState && config) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false });

        // Se o corretor está bloqueado, verificar se está dentro do horário permitido
        // Se sim, desbloqueia automaticamente. Se não, mantém o bloqueio.
        if (currentUser.blocked) {
          let isWithinSchedule = true;

          // Verificar horário global
          if (config.checkin_start && currentTime < config.checkin_start) {
            isWithinSchedule = false;
          }
          if (config.checkin_end && currentTime > config.checkin_end) {
            isWithinSchedule = false;
          }

          // Verificar janelas específicas (se existirem)
          if (config.access_schedules && Array.isArray(config.access_schedules) && config.access_schedules.length > 0) {
            const SCHED_WINDOWS = config.access_schedules as { start: string, end: string }[];
            const isInWindow = SCHED_WINDOWS.some(win => currentTime >= win.start && currentTime <= win.end);
            if (!isInWindow) {
              isWithinSchedule = false;
            }
          }

          if (!isWithinSchedule) {
            toast.error("Seu check-in está bloqueado e você está fora do horário permitido. Entre em contato com o gestor.");
            setCheckingIn(false);
            return;
          }

          // Dentro do horário: desbloqueia automaticamente
          await (supabase.from('profiles') as any).update({ blocked: false }).eq('id', currentUser.id);
        }

        // Horário Global
        if (config.checkin_start && currentTime < config.checkin_start) {
          toast.error(`Fora do horário! Check-in permitido apenas após ${config.checkin_start.substring(0, 5)}.`);
          setCheckingIn(false);
          return;
        }
        if (config.checkin_end && currentTime > config.checkin_end) {
          toast.error(`Fora do horário! Check-in permitido apenas até ${config.checkin_end.substring(0, 5)}.`);
          setCheckingIn(false);
          return;
        }

        // Janelas Específicas
        if (config.access_schedules && Array.isArray(config.access_schedules) && config.access_schedules.length > 0) {
          const SCHED_WINDOWS = config.access_schedules as { start: string, end: string }[];
          const isInWindow = SCHED_WINDOWS.some(win => currentTime >= win.start && currentTime <= win.end);
          if (!isInWindow) {
            const windowsStr = SCHED_WINDOWS.map((w: any) => `${w.start}-${w.end}`).join(', ');
            const failMsg = `FALHA CHECK-IN [Janela]: Corretor tentou entrar fora do horário. Permitidos: ${windowsStr}`;

            // Log Auditoria
            const currentIpVal = await (async () => {
              try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                return data.ip;
              } catch { return 'unknown'; }
            })();

            await (supabase as any).from('logs').insert({
              level: 'ERROR',
              message: failMsg,
              agency_id: currentUser.agency_id || currentUser.id,
              category: 'PONTO'
            });

            toast.error(`Fora da janela de check-in! Horários permitidos agora: ${windowsStr}`);
            setCheckingIn(false);
            return;
          }
        }

        // Validação de IP (se necessário hoje)
        const todayWeekday = new Date().getDay();
        const ipRequiredDays = config.ip_required_days as number[] || [];
        if (ipRequiredDays.includes(todayWeekday)) {
          try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            currentIp = data.ip;
          } catch {
            try {
              const res = await fetch('https://ipapi.co/json/');
              const data = await res.json();
              currentIp = data.ip;
            } catch (e) {
              console.error("IP services failed");
            }
          }

          if (currentIp && currentIp !== '0.0.0.0') {
            let allowedIps: string[] = [];
            if (Array.isArray(config.allowed_ips)) {
              allowedIps = config.allowed_ips.map((i: string) => i.trim()).filter(Boolean);
            } else if (typeof config.allowed_ips === 'string') {
              allowedIps = (config.allowed_ips as string).split(',').map((i: string) => i.trim()).filter(Boolean);
            }

            if (allowedIps.length > 0 && !allowedIps.includes(currentIp)) {
              const failMsg = `FALHA CHECK-IN [IP]: IP ${currentIp} não autorizado.`;

              await (supabase as any).from('logs').insert({
                level: 'ERROR',
                message: failMsg,
                agency_id: currentUser.agency_id || currentUser.id,
                category: 'PONTO'
              });

              toast.error(`Acesso negado: IP ${currentIp} não autorizado.`);
              setCheckingIn(false);
              return;
            }
          }
        }
      }

      // 3. Executar Update
      const updates: any = {
        active: newState ? 'ativado' : 'desativado',
        checkin: newState ? new Date().toLocaleTimeString('pt-BR', { hour12: false }) : null,
        is_online: newState // Sincronizar is_online com o estado do active
      };

      const { error: updateError } = await (supabase.from('profiles') as any).update(updates).eq('id', currentUser.id);
      if (updateError) throw updateError;

      // 4. Registrar Logs
      const actionType = newState ? 'CHECKIN_MANUAL' : 'CHECKOUT_MANUAL';
      const logMsg = newState
        ? `CHECK-IN MANUAL [Corretor: ${currentUser.name}]: Entrou no sistema.`
        : `CHECK-OUT MANUAL [Corretor: ${currentUser.name}]: Saiu do sistema.`;

      await (supabase as any).from('logs').insert({
        level: 'INFO',
        message: logMsg,
        agency_id: currentUser.agency_id || currentUser.id,
        category: 'PONTO'
      });

      await refetch();
      toast.success(newState ? 'Check-in realizado!' : 'Check-out realizado!');
    } catch (error: any) {
      console.error("Check-in Error", error);
      toast.error('Erro ao atualizar status: ' + error.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const isOnline = currentUser?.active === 'ativado';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col notranslate',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border relative">
        <div className={cn(
          'flex items-center gap-3 transition-all duration-300',
          collapsed ? 'justify-center' : 'px-4'
        )}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-black text-lg tracking-tight text-sidebar-foreground">CRM</h1>
              <span className="micro-label text-sidebar-foreground/60">Imobiliária</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'h-6 w-6 rounded-full hover:bg-sidebar-accent absolute -right-3 top-1/2 -translate-y-1/2 bg-sidebar border border-sidebar-border shadow-sm'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Check-in Button (below Logo) */}
      {!canViewTeam && currentUser && (
        <div className="px-3 pt-3">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleCheckInToggle}
                disabled={checkingIn}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 w-full shadow-sm border',
                  isOnline
                    ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20' // Online -> Red (Logout)
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600', // Offline -> Green (Login)
                  collapsed && 'justify-center'
                )}
              >
                <Power className={cn("w-5 h-5", isOnline ? "text-red-600" : "text-white")} />
                {!collapsed && (
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm uppercase tracking-wider">{isOnline ? 'SAIR (ONLINE)' : 'ENTRAR (OFFLINE)'}</span>
                    <span className={cn("text-[10px] font-mono", isOnline ? "opacity-70" : "text-white/80")}>
                      {isOnline ? `Desde ${currentUser.checkin?.substring(0, 5)}` : 'Clique para iniciar'}
                    </span>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-semibold">
                {isOnline ? 'Fazer Check-out' : 'Fazer Check-in'}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scroll">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-gtp'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
              {!collapsed && (
                <span className="font-semibold text-sm">{item.label}</span>
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-semibold">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer & Check-in */}
      <div className="p-3 border-t border-sidebar-border space-y-2">



        {/* Settings */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sidebar-foreground hover:bg-sidebar-accent',
                collapsed && 'justify-center'
              )}
            >
              <Settings className="w-5 h-5" />
              {!collapsed && <span className="font-semibold text-sm">Configurações</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-semibold">
              Configurações
            </TooltipContent>
          )}
        </Tooltip>

        {/* Logout */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={async () => {
                const { supabase } = await import('@/lib/supabase');
                await supabase.auth.signOut();
                localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token'); // Attempt to clean specific key if known, or just rely on reload
                queryClient.removeQueries();
                window.location.href = '/'; // FORCE RELOAD to clear everything
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive w-full',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="font-semibold text-sm">Sair</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-semibold">
              Sair
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside >
  );
}
