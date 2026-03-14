import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CheckSquare, StickyNote, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getIsActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <header className="flex items-center justify-center pt-6 pb-2">
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
                isActive && 'bg-muted text-primary'
              )}
            >
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2} />
              </span>

              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  className="absolute inset-0 w-full rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                >
                  {/* Glow effect */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full opacity-70 blur-[3px]" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full opacity-50 blur-[6px]" />
                  <div className="absolute inset-0 rounded-full bg-primary/5" />
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
};
