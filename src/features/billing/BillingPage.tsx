import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Globe, Calendar, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const BillingPage = () => {
  const queryClient = useQueryClient();
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

  // Filter for month view
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

  // Group by month for global view
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground text-ui mt-1">Gestiona tus facturas, ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGastoForm(true)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-ui font-medium hover:bg-muted transition-colors duration-150 inline-flex items-center gap-1.5"
          >
            <TrendingDown size={16} />
            Agregar gasto
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150 inline-flex items-center gap-1.5"
          >
            <Plus size={16} />
            Nueva factura
          </button>
        </div>
      </div>

      {showForm && <NewInvoiceForm onClose={() => setShowForm(false)} />}
      {showGastoForm && <NewGastoForm onClose={() => setShowGastoForm(false)} />}

      {/* View toggle + month nav */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsGlobal(true)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-300 border",
            isGlobal
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          <Globe size={14} />
          Global
        </button>
        <button
          onClick={() => setIsGlobal(false)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-300 border",
            !isGlobal
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          <Calendar size={14} />
          Por mes
        </button>
      </div>

      {/* Month navigator (only when not global) */}
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
            <div className="flex items-center justify-center gap-4 py-2">
              <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft size={20} />
              </button>
              <div className="text-center min-w-[200px]">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{MONTHS[viewMonth]}</h2>
                <p className="text-xs text-muted-foreground font-mono">{viewYear}</p>
              </div>
              <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <motion.div className="grid grid-cols-4 gap-4" initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="relative z-10">
            <span className="text-label text-muted-foreground">Total cobrado</span>
            <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">${totalPagado.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="relative z-10">
            <span className="text-label text-muted-foreground">Pendiente</span>
            <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">${totalPendiente.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="relative z-10">
            <span className="text-label text-muted-foreground">Gastos</span>
            <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular text-destructive">${totalGastos.toLocaleString()}</div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="relative z-10">
            <span className="text-label text-muted-foreground">Balance neto</span>
            <div className={cn("text-2xl font-semibold tracking-tight mt-1 font-mono-tabular", (totalPagado - totalGastos) >= 0 ? 'text-success' : 'text-destructive')}>
              ${(totalPagado - totalGastos).toLocaleString()}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Content with animated transition */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="space-y-8"
        >
          {/* Facturas section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ingresos</h3>
            {isLoading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : isGlobal ? (
              <GlobalInvoiceView groupedByMonth={groupedByMonth} facturas={facturas} />
            ) : (
              <MonthInvoiceView items={monthFacturas} monthLabel={`${MONTHS[viewMonth]} ${viewYear}`} />
            )}
          </div>

          {/* Gastos section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Gastos</h3>
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
    return <div className="glass-card p-12 text-center"><p className="text-sm text-muted-foreground">No hay facturas registradas aún.</p></div>;
  }
  return (
    <div className="space-y-6">
      {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
        const monthTotal = items.reduce((s: number, f: any) => s + Number(f.monto), 0);
        return (
          <div key={monthLabel} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-semibold text-foreground">{monthLabel}</h4>
              <span className="text-xs font-mono text-muted-foreground">${monthTotal.toLocaleString()}</span>
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
    return <div className="glass-card p-12 text-center"><p className="text-sm text-muted-foreground">No hay facturas en {monthLabel}.</p></div>;
  }
  return <InvoiceTable items={items} />;
}

/* ── Global Gastos View ── */
function GlobalGastosView({ groupedByMonth, gastos }: { groupedByMonth: Record<string, any[]>; gastos: any[] | undefined }) {
  if (!gastos || gastos.length === 0) {
    return <div className="glass-card p-12 text-center"><p className="text-sm text-muted-foreground">No hay gastos registrados aún.</p></div>;
  }
  return (
    <div className="space-y-6">
      {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
        const monthTotal = items.reduce((s: number, g: any) => s + Number(g.monto), 0);
        return (
          <div key={monthLabel} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-semibold text-foreground">{monthLabel}</h4>
              <span className="text-xs font-mono text-destructive">${monthTotal.toLocaleString()}</span>
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
    return <div className="glass-card p-12 text-center"><p className="text-sm text-muted-foreground">No hay gastos en {monthLabel}.</p></div>;
  }
  return <GastosTable items={items} />;
}

/* ── Reusable Invoice Table ── */
function InvoiceTable({ items }: { items: any[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="relative z-10">
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
      <div className="relative z-10">
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
    </div>
  );
}

/* ── Invoice Row with actions ── */
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
function NewInvoiceForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ id_proyecto: '', monto: '', concepto: '', fecha_emision: new Date().toISOString().split('T')[0] });

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('id, nombre_empresa').order('nombre_empresa');
      if (error) throw error;
      return data;
    },
  });

  // Fetch contract for selected project
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

  // Fetch already paid fee inicial for this project
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

  // Auto-fill monto when concepto or project changes
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
    // Build display concepto with month/year from fecha_emision
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

  const [conceptoType, setConceptoType] = useState('');

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

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nueva factura</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Proyecto</label>
          <select value={form.id_proyecto} onChange={e => { setForm(f => ({ ...f, id_proyecto: e.target.value, monto: '', concepto: '' })); setConceptoType(''); }} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Seleccionar...</option>
            {proyectos?.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto</label>
          <select
            value={conceptoType}
            onChange={e => handleConceptoChange(e.target.value)}
            disabled={!form.id_proyecto}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
          >
            <option value="">Seleccionar...</option>
            <option value="abono_mensual">Abono Mensual</option>
            <option value="fee_inicial">Fee Inicial</option>
            <option value="otro">Otro</option>
          </select>
          {conceptoType === 'fee_inicial' && contrato && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Fee total: ${Number(contrato.fee_inicial).toLocaleString()} · Facturado: ${(feeInicialPagado ?? 0).toLocaleString()} · <span className="text-primary font-medium">Restante: ${feeRestante.toLocaleString()}</span>
            </p>
          )}
          {conceptoType === 'abono_mensual' && contrato && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Abono mensual del contrato: <span className="text-primary font-medium">${Number(contrato.abono_mensual).toLocaleString()}</span>
            </p>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto</label>
          <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha emisión</label>
          <input type="date" value={form.fecha_emision} onChange={e => {
            setForm(f => ({ ...f, fecha_emision: e.target.value }));
            // Update concepto label if abono mensual
            if (conceptoType === 'abono_mensual') {
              const d = new Date(e.target.value + 'T00:00:00');
              setForm(f => ({ ...f, fecha_emision: e.target.value, concepto: `Abono Mensual - ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }));
            }
          }} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
      </div>
      {conceptoType === 'otro' && (
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto personalizado</label>
          <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Descripción del concepto" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={() => createInvoice.mutate()} disabled={!isValid || createInvoice.isPending} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {createInvoice.isPending ? 'Creando...' : 'Crear factura'}
        </button>
      </div>
    </motion.div>
  );
}

/* ── New Gasto Form ── */
function NewGastoForm({ onClose }: { onClose: () => void }) {
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

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nuevo gasto</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descripción</label>
          <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Hosting, Dominio, etc." className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto</label>
          <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Categoría</label>
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="general">General</option>
            <option value="hosting">Hosting</option>
            <option value="dominio">Dominio</option>
            <option value="software">Software</option>
            <option value="servicios">Servicios</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha del gasto</label>
          <input type="date" value={form.fecha_gasto} onChange={e => setForm(f => ({ ...f, fecha_gasto: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={() => createGasto.mutate()} disabled={!isValid || createGasto.isPending} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {createGasto.isPending ? 'Registrando...' : 'Registrar gasto'}
        </button>
      </div>
    </motion.div>
  );
}

export default BillingPage;
