import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', prefetchKey: null },
  { to: '/clients', label: 'Clientes', prefetchKey: 'clients' },
  { to: '/tasks', label: 'Tareas', prefetchKey: 'tasks' },
  { to: '/notes', label: 'Notas', prefetchKey: 'notes' },
  { to: '/billing', label: 'Facturación', prefetchKey: 'invoices' },
];

export const AppNavbar = () => {
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
    <header className="h-14 flex items-center px-8 bg-background">
      {/* Logo */}
      <span className="text-base mr-8" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
        N<span style={{ fontStyle: 'italic', fontWeight: 500 }}>uvvora</span>
      </span>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ to, label, prefetchKey }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onMouseEnter={() => handleMouseEnter(prefetchKey)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-ui transition-all duration-150',
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
};
