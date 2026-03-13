import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão geral' },
  '/leads': { title: 'Gestão de Clientes', subtitle: 'Gestão de Leads' },
  '/properties': { title: 'Imóveis', subtitle: 'Catálogo' },
  '/agenda': { title: 'Agenda', subtitle: 'Calendário' },
  '/settings': { title: 'Configurações', subtitle: 'Sistema' },
};

export function MainLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      // Default to dark mode
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sync to profile if user is logged in
    const syncTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase.from('profiles') as any).update({ theme: isDarkMode ? 'dark' : 'light' }).eq('id', user.id);
      }
    };
    syncTheme();
  }, [isDarkMode]);

  // Initial Fetch
  useEffect(() => {
    const fetchTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('theme').eq('id', user.id).single();
        if (profile?.theme) {
          setIsDarkMode(profile.theme === 'dark');
        }
      }
    };
    fetchTheme();
  }, []);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const currentPage = pageTitles[location.pathname] || { title: 'CRM' };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col',
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      )}>
        <Header
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          title={currentPage.title}
          subtitle={currentPage.subtitle}
        />
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
