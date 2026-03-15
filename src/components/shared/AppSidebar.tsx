import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  StickyNote,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, prefetchKey: null },
  { to: '/clients', label: 'Clientes', icon: Users, prefetchKey: 'clients' as const },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban, prefetchKey: 'projects' as const },
  { to: '/tasks', label: 'Tareas', icon: CheckSquare, prefetchKey: 'tasks' as const },
  { to: '/notes', label: 'Notas', icon: StickyNote, prefetchKey: 'notes' as const },
  { to: '/billing', label: 'Facturación', icon: Receipt, prefetchKey: 'invoices' as const },
];


export const AppSidebar = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  const handleMouseEnter = (prefetchKey: string | null) => {
    if (!prefetchKey) return;
    const state = queryClient.getQueryState([prefetchKey]);
    const isStale = !state || Date.now() - (state.dataUpdatedAt || 0) > 30000;
    if (isStale) {
      const fnMap: Record<string, () => Promise<unknown>> = {
        clients: api.getClients,
        projects: api.getProjects,
        tasks: api.getTasks,
        notes: api.getNotes,
        invoices: api.getInvoices,
      };
      if (fnMap[prefetchKey]) {
        queryClient.prefetchQuery({
          queryKey: [prefetchKey],
          queryFn: fnMap[prefetchKey],
        });
      }
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] flex flex-col bg-background z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-5">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Apex
        </span>
        <span className="text-base font-normal tracking-tight text-muted-foreground ml-1">
          Internal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, prefetchKey }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onMouseEnter={() => handleMouseEnter(prefetchKey)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-ui transition-all duration-150',
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border-subtle">
        <div className="text-[11px] text-muted-foreground">
          Apex Internal v0.1
        </div>
      </div>
    </aside>
  );
};
