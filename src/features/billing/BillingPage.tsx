import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { toast } from '@/hooks/use-toast';

const BillingPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

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

  const totalPagado = facturas?.filter(f => f.estado === 'pagado').reduce((s, f) => s + Number(f.monto), 0) ?? 0;
  const totalPendiente = facturas?.filter(f => f.estado === 'pendiente' || f.estado === 'vencido').reduce((s, f) => s + Number(f.monto), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground text-ui mt-1">Gestiona tus facturas e ingresos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150 inline-flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nueva factura
        </button>
      </div>

      {showForm && <NewInvoiceForm onClose={() => setShowForm(false)} />}

      <motion.div className="grid grid-cols-3 gap-4" initial="hidden" animate="show" variants={stagger}>
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
            <span className="text-label text-muted-foreground">Total facturas</span>
            <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">{facturas?.length ?? 0}</div>
          </div>
        </motion.div>
      </motion.div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="glass-card overflow-hidden">
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
                {(!facturas || facturas.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No hay facturas registradas aún.
                    </td>
                  </tr>
                ) : (
                  facturas.map(inv => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ── Invoice Row with actions ── */
function InvoiceRow({ invoice }: { invoice: any }) {
  const queryClient = useQueryClient();

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
    <tr className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150">
      <td className="py-3 px-4 text-ui font-medium text-foreground">
        {invoice.proyectos?.nombre_empresa ?? '—'}
      </td>
      <td className="py-3 px-4 text-ui text-muted-foreground">{invoice.concepto}</td>
      <td className="py-3 px-4 font-mono-tabular text-foreground">${Number(invoice.monto).toLocaleString()}</td>
      <td className="py-3 px-4"><StatusBadge status={invoice.estado as any} /></td>
      <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">{invoice.fecha_emision}</td>
      <td className="py-3 px-4">
        {invoice.estado === 'pendiente' && (
          <div className="flex gap-1">
            <button
              onClick={() => updateStatus.mutate('pagado')}
              className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
            >
              Marcar pagado
            </button>
            <button
              onClick={() => updateStatus.mutate('vencido')}
              className="text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Vencido
            </button>
          </div>
        )}
        {invoice.estado === 'vencido' && (
          <button
            onClick={() => updateStatus.mutate('pagado')}
            className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
          >
            Marcar pagado
          </button>
        )}
      </td>
    </tr>
  );
}

/* ── New Invoice Form ── */
function NewInvoiceForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    id_proyecto: '',
    monto: '',
    concepto: '',
    fecha_emision: new Date().toISOString().split('T')[0],
  });

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('id, nombre_empresa').order('nombre_empresa');
      if (error) throw error;
      return data;
    },
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('facturacion').insert({
        id_proyecto: form.id_proyecto,
        monto: parseFloat(form.monto),
        concepto: form.concepto,
        fecha_emision: form.fecha_emision,
        estado: 'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
      toast({ title: 'Factura creada' });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isValid = form.id_proyecto && form.monto && form.concepto;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nueva factura</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Proyecto</label>
          <select
            value={form.id_proyecto}
            onChange={e => setForm(f => ({ ...f, id_proyecto: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Seleccionar...</option>
            {proyectos?.map(p => (
              <option key={p.id} value={p.id}>{p.nombre_empresa}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto</label>
          <input
            type="number"
            value={form.monto}
            onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto</label>
          <input
            type="text"
            value={form.concepto}
            onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
            placeholder="Abono Mensual - Abril 2026"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha emisión</label>
          <input
            type="date"
            value={form.fecha_emision}
            onChange={e => setForm(f => ({ ...f, fecha_emision: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => createInvoice.mutate()}
          disabled={!isValid || createInvoice.isPending}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createInvoice.isPending ? 'Creando...' : 'Crear factura'}
        </button>
      </div>
    </motion.div>
  );
}

export default BillingPage;
