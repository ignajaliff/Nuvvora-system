import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CheckSquare, StickyNote, Receipt, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { LucideIcon } from 'lucide-react';

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/tasks', label: 'Tareas', icon: CheckSquare },
  { to: '/notes', label: 'Notas', icon: StickyNote },
  { to: '/billing', label: 'Facturación', icon: Receipt },
];

export const AppNavbar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getIsActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <>
      {/* Mobile: top bar with small logout */}
      <div className="md:hidden flex items-center justify-start px-3 pt-1.5 pb-0">
        <button
          onClick={signOut}
          className="p-1 rounded-full text-muted-foreground/30 hover:text-foreground transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={12} strokeWidth={1.5} />
        </button>
      </div>

      {/* Desktop: top navbar */}
      <header className="hidden md:flex items-center px-8 pt-6 pb-2">
        <span className="text-base mr-8 shrink-0" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          N<span style={{ fontStyle: 'italic', fontWeight: 500 }}>uvvora</span>
        </span>

        <div className="flex-1 flex justify-center">
          <nav className="flex items-center gap-1 rounded-full border border-border/40 bg-background/5 backdrop-blur-lg px-2 py-1.5 shadow-sm">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = getIsActive(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'relative cursor-pointer text-[15px] font-medium px-5 py-2 rounded-full transition-colors',
                    'text-foreground/60 hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tubelight"
                      className="absolute inset-0 w-full rounded-full -z-10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    >
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-primary rounded-full opacity-80" />
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-primary rounded-full opacity-40 blur-[4px]" />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-2 bg-primary rounded-full opacity-20 blur-[8px]" />
                      <div className="absolute inset-0 rounded-full bg-primary/5" />
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <button
          onClick={signOut}
          className="shrink-0 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </header>

      {/* Mobile: bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/40 bg-background/80 backdrop-blur-lg px-2 pt-2.5 pb-7">
        {navItems.map(({ to, icon: Icon }) => {
          const isActive = getIsActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'relative flex items-center justify-center p-2.5 rounded-full transition-colors',
                'text-foreground/40',
                isActive && 'text-primary'
              )}
            >
              <Icon size={20} strokeWidth={2} />
              {isActive && (
                <motion.div
                  layoutId="tubelight-mobile"
                  className="absolute inset-0 rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full opacity-80" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full opacity-40 blur-[4px]" />
                  <div className="absolute inset-0 rounded-full bg-primary/5" />
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
