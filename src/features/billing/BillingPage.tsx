import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Globe, Calendar, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/* ── Responsive Modal: Drawer on mobile, inline on desktop ── */
function ResponsiveFormWrapper({ open, onClose, title, titleIcon, children, isMobile }: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  isMobile: boolean;
}) {
  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => { if (!v) onClose(); }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              {titleIcon}
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return <>{children}</>;
}

const BillingPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [isGlobal, setIsGlobal] = useState(true);

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturacion')
        .select('*, proyectos(nombre_empresa)')
        .order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: gastos, isLoading: gastosLoading } = useQuery({
    queryKey: ['gastos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha_gasto', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const goMonth = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const monthFacturas = facturas?.filter(f => {
    const d = new Date(f.fecha_emision + 'T00:00:00');
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const monthGastos = gastos?.filter(g => {
    const d = new Date(g.fecha_gasto + 'T00:00:00');
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const viewItems = isGlobal ? facturas : monthFacturas;
  const viewGastos = isGlobal ? gastos : monthGastos;
  const totalPagado = viewItems?.filter(f => f.estado === 'pagado').reduce((s, f) => s + Number(f.monto), 0) ?? 0;
  const totalPendiente = viewItems?.filter(f => f.estado === 'pendiente' || f.estado === 'vencido').reduce((s, f) => s + Number(f.monto), 0) ?? 0;
  const totalGastos = viewGastos?.reduce((s, g) => s + Number(g.monto), 0) ?? 0;

  const groupedByMonth: Record<string, typeof facturas> = {};
  facturas?.forEach(f => {
    const d = new Date(f.fecha_emision + 'T00:00:00');
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key]!.push(f);
  });

  const groupedGastosByMonth: Record<string, NonNullable<typeof gastos>> = {};
  gastos?.forEach(g => {
    const d = new Date(g.fecha_gasto + 'T00:00:00');
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groupedGastosByMonth[key]) groupedGastosByMonth[key] = [];
    groupedGastosByMonth[key]!.push(g);
  });

  const viewKey = isGlobal ? 'global' : `${viewMonth}-${viewYear}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground text-[11px] sm:text-ui mt-0.5 sm:mt-1 hidden sm:block">Gestiona tus facturas, ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowGastoForm(true)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border bg-background text-foreground text-[11px] sm:text-ui font-medium hover:bg-muted transition-colors duration-150 inline-flex items-center gap-1 sm:gap-1.5"
          >
            <TrendingDown size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Agregar gasto</span>
            <span className="sm:hidden">Gasto</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-ui font-medium hover:opacity-90 transition-opacity duration-150 inline-flex items-center gap-1 sm:gap-1.5"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nueva factura</span>
            <span className="sm:hidden">Factura</span>
          </button>
        </div>
      </div>

      {/* Forms - Drawer on mobile, inline on desktop */}
      <ResponsiveFormWrapper open={showForm} onClose={() => setShowForm(false)} title="Nueva factura" titleIcon={<Plus size={16} />} isMobile={isMobile}>
        <NewInvoiceForm onClose={() => setShowForm(false)} isMobile={isMobile} />
      </ResponsiveFormWrapper>
      <ResponsiveFormWrapper open={showGastoForm} onClose={() => setShowGastoForm(false)} title="Nuevo gasto" titleIcon={<TrendingDown size={16} />} isMobile={isMobile}>
        <NewGastoForm onClose={() => setShowGastoForm(false)} isMobile={isMobile} />
      </ResponsiveFormWrapper>

      {/* View toggle */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsGlobal(true)}
          className={cn(
            "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium inline-flex items-center gap-1 sm:gap-1.5 transition-all duration-300 border",
            isGlobal
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          <Globe size={12} className="sm:w-3.5 sm:h-3.5" />
          Global
        </button>
        <button
          onClick={() => setIsGlobal(false)}
          className={cn(
            "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium inline-flex items-center gap-1 sm:gap-1.5 transition-all duration-300 border",
            !isGlobal
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
          Por mes
        </button>
      </div>

      {/* Month navigator */}
      <AnimatePresence mode="wait">
        {!isGlobal && (
          <motion.div
            key="month-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-1.5 sm:py-2">
              <button onClick={() => goMonth(-1)} className="p-1 sm:p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="text-center min-w-[150px] sm:min-w-[200px]">
                <h2 className="text-base sm:text-xl font-semibold tracking-tight text-foreground">{MONTHS[viewMonth]}</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">{viewYear}</p>
              </div>
              <button onClick={() => goMonth(1)} className="p-1 sm:p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4" initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="glass-card p-3 sm:p-5">
          <div className="relative z-10">
            <span className="text-[9px] sm:text-label text-muted-foreground uppercase font-semibold tracking-wider">Total cobrado</span>
            <div className="text-base sm:text-2xl font-semibold tracking-tight mt-0.5 sm:mt-1 font-mono-tabular">${totalPagado.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-3 sm:p-5">
          <div className="relative z-10">
            <span className="text-[9px] sm:text-label text-muted-foreground uppercase font-semibold tracking-wider">Pendiente</span>
            <div className="text-base sm:text-2xl font-semibold tracking-tight mt-0.5 sm:mt-1 font-mono-tabular">${totalPendiente.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-3 sm:p-5">
          <div className="relative z-10">
            <span className="text-[9px] sm:text-label text-muted-foreground uppercase font-semibold tracking-wider">Gastos</span>
            <div className="text-base sm:text-2xl font-semibold tracking-tight mt-0.5 sm:mt-1 font-mono-tabular text-destructive">${totalGastos.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-3 sm:p-5">
          <div className="relative z-10">
            <span className="text-[9px] sm:text-label text-muted-foreground uppercase font-semibold tracking-wider">Balance neto</span>
            <div className={cn("text-base sm:text-2xl font-semibold tracking-tight mt-0.5 sm:mt-1 font-mono-tabular", (totalPagado - totalGastos) >= 0 ? 'text-success' : 'text-destructive')}>
              ${(totalPagado - totalGastos).toLocaleString()}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Facturas */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ingresos</h3>
            {isLoading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : isGlobal ? (
              <GlobalInvoiceView groupedByMonth={groupedByMonth} facturas={facturas} />
            ) : (
              <MonthInvoiceView items={monthFacturas} monthLabel={`${MONTHS[viewMonth]} ${viewYear}`} />
            )}
          </div>

          {/* Gastos */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Gastos</h3>
            {gastosLoading ? (
              <SkeletonTable rows={3} cols={4} />
            ) : isGlobal ? (
              <GlobalGastosView groupedByMonth={groupedGastosByMonth} gastos={gastos} />
            ) : (
              <MonthGastosView items={monthGastos} monthLabel={`${MONTHS[viewMonth]} ${viewYear}`} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Global Invoice View ── */
function GlobalInvoiceView({ groupedByMonth, facturas }: { groupedByMonth: Record<string, any[]>; facturas: any[] | undefined }) {
  if (!facturas || facturas.length === 0) {
    return <div className="glass-card p-8 sm:p-12 text-center"><p className="text-xs sm:text-sm text-muted-foreground">No hay facturas registradas aún.</p></div>;
  }
  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
        const monthTotal = items.reduce((s: number, f: any) => s + Number(f.monto), 0);
        return (
          <div key={monthLabel} className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">{monthLabel}</h4>
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">${monthTotal.toLocaleString()}</span>
            </div>
            <InvoiceTable items={items} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Month Invoice View ── */
function MonthInvoiceView({ items, monthLabel }: { items: any[] | undefined; monthLabel: string }) {
  if (!items || items.length === 0) {
    return <div className="glass-card p-8 sm:p-12 text-center"><p className="text-xs sm:text-sm text-muted-foreground">No hay facturas en {monthLabel}.</p></div>;
  }
  return <InvoiceTable items={items} />;
}

/* ── Global Gastos View ── */
function GlobalGastosView({ groupedByMonth, gastos }: { groupedByMonth: Record<string, any[]>; gastos: any[] | undefined }) {
  if (!gastos || gastos.length === 0) {
    return <div className="glass-card p-8 sm:p-12 text-center"><p className="text-xs sm:text-sm text-muted-foreground">No hay gastos registrados aún.</p></div>;
  }
  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
        const monthTotal = items.reduce((s: number, g: any) => s + Number(g.monto), 0);
        return (
          <div key={monthLabel} className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">{monthLabel}</h4>
              <span className="text-[10px] sm:text-xs font-mono text-destructive">${monthTotal.toLocaleString()}</span>
            </div>
            <GastosTable items={items} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Month Gastos View ── */
function MonthGastosView({ items, monthLabel }: { items: any[] | undefined; monthLabel: string }) {
  if (!items || items.length === 0) {
    return <div className="glass-card p-8 sm:p-12 text-center"><p className="text-xs sm:text-sm text-muted-foreground">No hay gastos en {monthLabel}.</p></div>;
  }
  return <GastosTable items={items} />;
}

/* ── Reusable Invoice Table ── */
function InvoiceTable({ items }: { items: any[] }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Desktop table */}
      <div className="relative z-10 hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/5">
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Cliente</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Concepto</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Monto</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Estado</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Emisión</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(inv => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-foreground/5">
        {items.map(inv => (
          <MobileInvoiceCard key={inv.id} invoice={inv} />
        ))}
      </div>
    </div>
  );
}

/* ── Mobile Invoice Card ── */
function MobileInvoiceCard({ invoice }: { invoice: any }) {
  const queryClient = useQueryClient();
  const isFee = invoice.concepto.startsWith('Fee Inicial');

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const updateData: any = { estado: newStatus };
      if (newStatus === 'pagado') updateData.fecha_pago = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('facturacion').update(updateData).eq('id', invoice.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  return (
    <div className={cn("p-3 space-y-1.5", isFee && "bg-primary/[0.03]")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{invoice.proyectos?.nombre_empresa ?? '—'}</p>
          <p className={cn("text-[10px] text-muted-foreground mt-0.5 truncate", isFee && "text-primary font-medium")}>{invoice.concepto}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs font-semibold text-foreground">${Number(invoice.monto).toLocaleString()}</span>
          <StatusBadge status={invoice.estado as any} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">{invoice.fecha_emision}</span>
        <div className="flex gap-1">
          {invoice.estado === 'pendiente' && (
            <>
              <button onClick={() => updateStatus.mutate('pagado')} className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">Pagado</button>
              <button onClick={() => updateStatus.mutate('vencido')} className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">Vencido</button>
            </>
          )}
          {invoice.estado === 'vencido' && (
            <button onClick={() => updateStatus.mutate('pagado')} className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">Pagado</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Gastos Table ── */
function GastosTable({ items }: { items: any[] }) {
  const queryClient = useQueryClient();

  const deleteGasto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      toast({ title: 'Gasto eliminado' });
    },
  });

  return (
    <div className="glass-card overflow-hidden">
      {/* Desktop table */}
      <div className="relative z-10 hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/5">
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Descripción</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Categoría</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Monto</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Fecha</th>
              <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(g => (
              <tr key={g.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150">
                <td className="py-3 px-4 text-ui text-foreground">{g.descripcion}</td>
                <td className="py-3 px-4">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{g.categoria}</span>
                </td>
                <td className="py-3 px-4 font-mono-tabular text-destructive">${Number(g.monto).toLocaleString()}</td>
                <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">{g.fecha_gasto}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => deleteGasto.mutate(g.id)}
                    className="text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-foreground/5">
        {items.map(g => (
          <div key={g.id} className="p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{g.descripcion}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{g.categoria}</span>
              </div>
              <span className="font-mono text-xs font-semibold text-destructive shrink-0">${Number(g.monto).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">{g.fecha_gasto}</span>
              <button
                onClick={() => deleteGasto.mutate(g.id)}
                className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Invoice Row (desktop) ── */
function InvoiceRow({ invoice }: { invoice: any }) {
  const queryClient = useQueryClient();
  const isFee = invoice.concepto.startsWith('Fee Inicial');

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const updateData: any = { estado: newStatus };
      if (newStatus === 'pagado') updateData.fecha_pago = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('facturacion').update(updateData).eq('id', invoice.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  return (
    <tr className={cn(
      "border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150",
      isFee && "bg-primary/[0.03]"
    )}>
      <td className="py-3 px-4 text-ui font-medium text-foreground">
        {invoice.proyectos?.nombre_empresa ?? '—'}
      </td>
      <td className="py-3 px-4 text-ui text-muted-foreground">
        <span className={cn("inline-flex items-center gap-1.5", isFee && "text-primary font-medium")}>
          {invoice.concepto}
        </span>
      </td>
      <td className="py-3 px-4 font-mono-tabular text-foreground">${Number(invoice.monto).toLocaleString()}</td>
      <td className="py-3 px-4"><StatusBadge status={invoice.estado as any} /></td>
      <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">{invoice.fecha_emision}</td>
      <td className="py-3 px-4">
        {invoice.estado === 'pendiente' && (
          <div className="flex gap-1">
            <button onClick={() => updateStatus.mutate('pagado')} className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">Marcar pagado</button>
            <button onClick={() => updateStatus.mutate('vencido')} className="text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">Vencido</button>
          </div>
        )}
        {invoice.estado === 'vencido' && (
          <button onClick={() => updateStatus.mutate('pagado')} className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">Marcar pagado</button>
        )}
      </td>
    </tr>
  );
}

/* ── New Invoice Form ── */
function NewInvoiceForm({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ id_proyecto: '', monto: '', concepto: '', fecha_emision: new Date().toISOString().split('T')[0] });
  const [conceptoType, setConceptoType] = useState('');

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('id, nombre_empresa').order('nombre_empresa');
      if (error) throw error;
      return data;
    },
  });

  const { data: contrato } = useQuery({
    queryKey: ['contrato', form.id_proyecto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_proyecto')
        .select('*')
        .eq('id_proyecto', form.id_proyecto)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!form.id_proyecto,
  });

  const { data: feeInicialPagado } = useQuery({
    queryKey: ['fee-inicial-pagado', form.id_proyecto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturacion')
        .select('monto')
        .eq('id_proyecto', form.id_proyecto)
        .ilike('concepto', '%Fee Inicial%');
      if (error) throw error;
      return data?.reduce((sum, f) => sum + Number(f.monto), 0) ?? 0;
    },
    enabled: !!form.id_proyecto,
  });

  const handleConceptoChange = (concepto: string) => {
    let monto = '';
    if (contrato) {
      if (concepto === 'abono_mensual') {
        monto = String(contrato.abono_mensual);
      } else if (concepto === 'fee_inicial') {
        const restante = Math.max(0, Number(contrato.fee_inicial) - (feeInicialPagado ?? 0));
        monto = String(restante);
      }
    }
    const d = new Date(form.fecha_emision + 'T00:00:00');
    let displayConcepto = '';
    if (concepto === 'abono_mensual') {
      displayConcepto = `Abono Mensual - ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    } else if (concepto === 'fee_inicial') {
      displayConcepto = `Fee Inicial`;
    } else {
      displayConcepto = concepto;
    }
    setForm(f => ({ ...f, concepto: displayConcepto, monto }));
    setConceptoType(concepto);
  };

  const createInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('facturacion').insert({
        id_proyecto: form.id_proyecto, monto: parseFloat(form.monto), concepto: form.concepto, fecha_emision: form.fecha_emision, estado: 'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facturacion'] }); toast({ title: 'Factura creada' }); onClose(); },
    onError: (err: any) => { toast({ title: 'Error', description: err.message, variant: 'destructive' }); },
  });

  const isValid = form.id_proyecto && form.monto && form.concepto;
  const feeRestante = contrato ? Math.max(0, Number(contrato.fee_inicial) - (feeInicialPagado ?? 0)) : 0;

  const inputClass = "mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground";
  const labelClass = "text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider";

  const formContent = (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={labelClass}>Proyecto</label>
          <select value={form.id_proyecto} onChange={e => { setForm(f => ({ ...f, id_proyecto: e.target.value, monto: '', concepto: '' })); setConceptoType(''); }} className={inputClass}>
            <option value="">Seleccionar...</option>
            {proyectos?.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Concepto</label>
          <select
            value={conceptoType}
            onChange={e => handleConceptoChange(e.target.value)}
            disabled={!form.id_proyecto}
            className={cn(inputClass, "disabled:opacity-50")}
          >
            <option value="">Seleccionar...</option>
            <option value="abono_mensual">Abono Mensual</option>
            <option value="fee_inicial">Fee Inicial</option>
            <option value="otro">Otro</option>
          </select>
          {conceptoType === 'fee_inicial' && contrato && (
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-1">
              Fee: ${Number(contrato.fee_inicial).toLocaleString()} · <span className="text-primary font-medium">Rest: ${feeRestante.toLocaleString()}</span>
            </p>
          )}
          {conceptoType === 'abono_mensual' && contrato && (
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-1">
              Abono: <span className="text-primary font-medium">${Number(contrato.abono_mensual).toLocaleString()}</span>
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fecha emisión</label>
          <input type="date" value={form.fecha_emision} onChange={e => {
            setForm(f => ({ ...f, fecha_emision: e.target.value }));
            if (conceptoType === 'abono_mensual') {
              const d = new Date(e.target.value + 'T00:00:00');
              setForm(f => ({ ...f, fecha_emision: e.target.value, concepto: `Abono Mensual - ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }));
            }
          }} className={inputClass} />
        </div>
      </div>
      {conceptoType === 'otro' && (
        <div>
          <label className={labelClass}>Concepto personalizado</label>
          <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Descripción del concepto" className={inputClass} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        {!isMobile && <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>}
        <button onClick={() => createInvoice.mutate()} disabled={!isValid || createInvoice.isPending} className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {createInvoice.isPending ? 'Creando...' : 'Crear factura'}
        </button>
      </div>
    </div>
  );

  if (isMobile) return formContent;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nueva factura</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      {formContent}
    </motion.div>
  );
}

/* ── New Gasto Form ── */
function NewGastoForm({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    categoria: 'general',
    fecha_gasto: new Date().toISOString().split('T')[0],
  });

  const createGasto = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gastos').insert({
        descripcion: form.descripcion,
        monto: parseFloat(form.monto),
        categoria: form.categoria,
        fecha_gasto: form.fecha_gasto,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      toast({ title: 'Gasto registrado' });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isValid = form.descripcion && form.monto && parseFloat(form.monto) > 0;

  const inputClass = "mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground";
  const labelClass = "text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider";

  const formContent = (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={labelClass}>Descripción</label>
          <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Hosting, Dominio, etc." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Categoría</label>
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inputClass}>
            <option value="general">General</option>
            <option value="hosting">Hosting</option>
            <option value="dominio">Dominio</option>
            <option value="software">Software</option>
            <option value="servicios">Servicios</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Fecha del gasto</label>
          <input type="date" value={form.fecha_gasto} onChange={e => setForm(f => ({ ...f, fecha_gasto: e.target.value }))} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {!isMobile && <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>}
        <button onClick={() => createGasto.mutate()} disabled={!isValid || createGasto.isPending} className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {createGasto.isPending ? 'Registrando...' : 'Registrar gasto'}
        </button>
      </div>
    </div>
  );

  if (isMobile) return formContent;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nuevo gasto</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      {formContent}
    </motion.div>
  );
}

export default BillingPage;
