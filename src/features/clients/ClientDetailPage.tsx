import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, CreditCard, KeyRound, ListTodo, FileText, Plus, X, Eye, EyeOff, MoreVertical, Pencil, Trash2, Copy, ExternalLink, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/animations';

function formatClientSince(dateStr: string) {
  const date = new Date(dateStr);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getLogoUrl(path: string) {
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return data.publicUrl;
}

const tabs = [
  { id: 'general', label: 'General', icon: Info },
  { id: 'tareas', label: 'Tareas', icon: ListTodo },
  { id: 'payments', label: 'Pagos y Contrato', icon: CreditCard },
  { id: 'api', label: 'API Vault', icon: KeyRound },
] as const;

type TabId = typeof tabs[number]['id'];

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const { data: client, isLoading } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Cliente no encontrado.</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-primary underline text-sm">
          Volver a clientes
        </button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-4 sm:space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/clients')}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Clientes
      </button>

      {/* Header card */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-5">
          {/* Logo */}
          <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl border border-border bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {client.logo_empresa ? (
              <img
                src={getLogoUrl(client.logo_empresa)}
                alt={`${client.nombre_empresa} logo`}
                className="h-full w-full object-contain p-1.5 sm:p-2"
              />
            ) : (
              <span className="text-sm sm:text-xl font-semibold text-muted-foreground">
                {client.nombre_empresa.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-base sm:text-2xl font-semibold text-foreground tracking-tight">
                {client.nombre_empresa}
              </h1>
              <StatusBadge status={client.estado as any} />
            </div>
            {client.nombre_cliente && (
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">{client.nombre_cliente}</p>
            )}
            <p className="text-muted-foreground text-[10px] sm:text-xs font-mono mt-1">
              ID: {client.id.slice(0, 8).toUpperCase()}
            </p>
            {/* Mobile project links */}
            {((client as any).link1 || (client as any).link2) && (
              <div className="flex items-center gap-2 mt-2 sm:hidden">
                {(client as any).link1 && (
                  <a href={(client as any).link1} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    Ver Proyecto
                  </a>
                )}
                {(client as any).link2 && (
                  <a href={(client as any).link2} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
                    Ver Proyecto (2)
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Desktop project links - right side */}
          {((client as any).link1 || (client as any).link2) && (
            <div className="hidden sm:flex items-center gap-2 shrink-0 self-center">
              {(client as any).link1 && (
                <a
                  href={(client as any).link1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Ver Proyecto
                </a>
              )}
              {(client as any).link2 && (
                <a
                  href={(client as any).link2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Ver Proyecto (2)
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1 mt-4 sm:mt-6 border-t border-border/50 pt-3 sm:pt-4 overflow-x-auto scrollbar-hide">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'relative inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0',
                activeTab === tabId
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <Icon size={14} className="sm:w-4 sm:h-4" />
              {label}
              {activeTab === tabId && (
                <motion.div
                  layoutId="client-tab-indicator"
                  className="absolute bottom-0 left-2.5 right-2.5 sm:left-4 sm:right-4 h-0.5 bg-foreground rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-5">
        {activeTab === 'general' && <GeneralTab client={client} />}
        {activeTab === 'tareas' && <TareasTab projectId={client.id} />}
        {activeTab === 'payments' && <PaymentsContractTab projectId={client.id} />}
        {activeTab === 'api' && <ApiVaultTab projectId={client.id} />}
      </div>
    </motion.div>
  );
};

/* ── General Tab ── */
function GeneralTab({ client }: { client: any }) {
  const queryClient = useQueryClient();
  const [progreso, setProgreso] = useState<number>(client.progreso ?? 0);
  const [saving, setSaving] = useState(false);

  const handleProgresoChange = async (value: number) => {
    setProgreso(value);
    setSaving(true);
    const { error } = await supabase.from('proyectos').update({ progreso: value } as any).eq('id', client.id);
    setSaving(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['proyecto', client.id] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
      <div className="lg:col-span-3 glass-card p-4 sm:p-6 space-y-4 sm:space-y-5">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <Info size={14} className="text-muted-foreground" />
          Detalles de la organización
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa</p>
            <p className="text-xs sm:text-sm text-foreground mt-1">{client.nombre_empresa}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contacto</p>
            <p className="text-xs sm:text-sm text-foreground mt-1">{client.nombre_cliente || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente desde</p>
            <p className="text-xs sm:text-sm text-foreground mt-1">{formatClientSince(client.cliente_desde)}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
            <div className="mt-1"><StatusBadge status={client.estado as any} /></div>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progreso del proyecto</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <input type="range" min={0} max={100} step={5} value={progreso} onChange={e => handleProgresoChange(Number(e.target.value))} className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary bg-foreground/5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
              <span className="text-xs sm:text-sm font-mono font-medium text-foreground min-w-[3ch] text-right">{progreso}%</span>
            </div>
            {saving && <p className="text-[10px] text-muted-foreground mt-1">Guardando...</p>}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 glass-card p-4 sm:p-6 space-y-4 sm:space-y-5">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          Información técnica
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stack</p>
            <p className="text-xs sm:text-sm text-foreground font-mono mt-1">{client.stack || '—'}</p>
          </div>
          <VersionField client={client} />
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Creado</p>
            <p className="text-xs sm:text-sm text-foreground mt-1">
              {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Contrato Tab ── */
function ContratoTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_proyecto')
        .select('*')
        .eq('id_proyecto', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    fee_inicial: '',
    abono_mensual: '',
    dia_facturacion: '1',
    moneda: 'USD',
    estado_contrato: 'propuesta',
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        id_proyecto: projectId,
        fee_inicial: parseFloat(form.fee_inicial) || 0,
        abono_mensual: parseFloat(form.abono_mensual) || 0,
        dia_facturacion: parseInt(form.dia_facturacion) || 1,
        moneda: form.moneda,
        estado_contrato: form.estado_contrato,
      };
      if (contrato) {
        const { error } = await supabase.from('contratos_proyecto').update(payload).eq('id', contrato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contratos_proyecto').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato', projectId] });
      toast({ title: 'Contrato guardado' });
      setEditing(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const startEdit = () => {
    setForm({
      fee_inicial: contrato?.fee_inicial?.toString() ?? '',
      abono_mensual: contrato?.abono_mensual?.toString() ?? '',
      dia_facturacion: contrato?.dia_facturacion?.toString() ?? '1',
      moneda: contrato?.moneda ?? 'USD',
      estado_contrato: contrato?.estado_contrato ?? 'propuesta',
    });
    setEditing(true);
  };

  if (isLoading) return <SkeletonCard />;

  if (!contrato && !editing) {
    return (
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          <FileText size={20} className="text-muted-foreground mb-2 sm:mb-3" />
          <p className="text-muted-foreground text-xs sm:text-sm">No hay contrato configurado.</p>
          <button onClick={startEdit} className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">
            Crear contrato
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">{contrato ? 'Editar contrato' : 'Nuevo contrato'}</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fee inicial</label>
            <input type="number" value={form.fee_inicial} onChange={e => setForm(f => ({ ...f, fee_inicial: e.target.value }))} placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Abono mensual</label>
            <input type="number" value={form.abono_mensual} onChange={e => setForm(f => ({ ...f, abono_mensual: e.target.value }))} placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Día facturación</label>
            <input type="number" min="1" max="28" value={form.dia_facturacion} onChange={e => setForm(f => ({ ...f, dia_facturacion: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Moneda</label>
            <select value={form.moneda} onChange={e => setForm(f => ({ ...f, moneda: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</label>
            <select value={form.estado_contrato} onChange={e => setForm(f => ({ ...f, estado_contrato: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground">
              <option value="propuesta">Propuesta</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="px-3 sm:px-4 py-1.5 rounded-lg border border-border text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
          <button onClick={() => upsert.mutate()} disabled={upsert.isPending} className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {upsert.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <FileText size={14} className="text-muted-foreground" />
          Contrato
        </h2>
        <div className="flex items-center gap-2">
          <StatusBadge status={contrato.estado_contrato as any} />
          <button onClick={startEdit} className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">Editar</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fee inicial</p>
          <p className="text-xs sm:text-sm text-foreground font-mono mt-1">${Number(contrato.fee_inicial).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Abono mensual</p>
          <p className="text-xs sm:text-sm text-foreground font-mono mt-1">${Number(contrato.abono_mensual).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Día facturación</p>
          <p className="text-xs sm:text-sm text-foreground font-mono mt-1">{contrato.dia_facturacion}</p>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Moneda</p>
          <p className="text-xs sm:text-sm text-foreground font-mono mt-1">{contrato.moneda}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Combined Payments & Contract Tab ── */
function PaymentsContractTab({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <ContratoTab projectId={projectId} />
      <PaymentsSection projectId={projectId} />
    </div>
  );
}

/* ── Payments Section ── */
function PaymentsSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturacion', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturacion')
        .select('*')
        .eq('id_proyecto', projectId)
        .order('fecha_emision', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: contrato } = useQuery({
    queryKey: ['contrato', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_proyecto')
        .select('*')
        .eq('id_proyecto', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const updateData: any = { estado: newStatus };
      if (newStatus === 'pagado') updateData.fecha_pago = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('facturacion').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturacion', projectId] });
      toast({ title: 'Estado actualizado' });
    },
  });

  if (isLoading) return <SkeletonCard />;

  const feeInicialItems = facturas?.filter(f => f.concepto.startsWith('Fee Inicial')) ?? [];
  const abonoItems = facturas?.filter(f => f.concepto.startsWith('Abono Mensual')) ?? [];

  const feeInicialTotal = contrato ? Number(contrato.fee_inicial) : 0;
  const feeInicialPagado = feeInicialItems.reduce((s, f) => s + Number(f.monto), 0);
  const feeInicialRestante = feeInicialTotal - feeInicialPagado;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <CreditCard size={14} className="text-muted-foreground" />
          Historial de pagos
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1"
        >
          <Plus size={14} />
          Nuevo
        </button>
      </div>

      {showForm && (
        <PaymentInvoiceForm
          projectId={projectId}
          contrato={contrato}
          feeInicialRestante={feeInicialRestante}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Fee Inicial section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Fee Inicial</h3>
          {contrato && (
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono flex-wrap">
              <span className="text-muted-foreground">Total: <span className="text-foreground">${feeInicialTotal.toLocaleString()}</span></span>
              <span className="text-muted-foreground">Pagado: <span className="text-foreground">${feeInicialPagado.toLocaleString()}</span></span>
              <span className={cn('font-semibold', feeInicialRestante > 0 ? 'text-warning' : 'text-success')}>
                Rest: ${Math.max(0, feeInicialRestante).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        {feeInicialItems.length === 0 ? (
          <div className="glass-card p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">No hay pagos de Fee Inicial registrados.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {feeInicialItems.map(f => (
              <div key={f.id} className="glass-card p-3 sm:p-4 border-l-4 border-l-primary/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{f.concepto}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">
                      {f.fecha_emision} {f.fecha_pago ? `• ${f.fecha_pago}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">${Number(f.monto).toLocaleString()}</span>
                    <StatusBadge status={f.estado as any} />
                    {(f.estado === 'pendiente' || f.estado === 'vencido') && (
                      <button
                        onClick={() => updateStatus.mutate({ id: f.id, newStatus: 'pagado' })}
                        className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        Pagado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abono Mensual section */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Abono Mensual</h3>
        {abonoItems.length === 0 ? (
          <div className="glass-card p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">No hay pagos de Abono Mensual registrados.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {abonoItems.map(f => (
              <div key={f.id} className="glass-card p-3 sm:p-4 border-l-4 border-l-accent/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{f.concepto}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">
                      {f.fecha_emision} {f.fecha_pago ? `• ${f.fecha_pago}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">${Number(f.monto).toLocaleString()}</span>
                    <StatusBadge status={f.estado as any} />
                    {(f.estado === 'pendiente' || f.estado === 'vencido') && (
                      <button
                        onClick={() => updateStatus.mutate({ id: f.id, newStatus: 'pagado' })}
                        className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        Pagado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payment Invoice Form (within client) ── */
function PaymentInvoiceForm({ projectId, contrato, feeInicialRestante, onClose }: {
  projectId: string;
  contrato: any;
  feeInicialRestante: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();

  const [conceptoType, setConceptoType] = useState<'abono' | 'fee'>('abono');
  const [monto, setMonto] = useState(contrato ? String(Number(contrato.abono_mensual)) : '');
  const [fechaEmision, setFechaEmision] = useState(now.toISOString().split('T')[0]);

  const handleConceptChange = (type: 'abono' | 'fee') => {
    setConceptoType(type);
    if (type === 'abono' && contrato) {
      setMonto(String(Number(contrato.abono_mensual)));
    } else if (type === 'fee' && contrato) {
      setMonto(String(Math.max(0, feeInicialRestante)));
    } else {
      setMonto('');
    }
  };

  // Derive month/year from fechaEmision, not from current date
  const emisionDate = new Date(fechaEmision + 'T00:00:00');
  const conceptoText = conceptoType === 'abono'
    ? `Abono Mensual - ${months[emisionDate.getMonth()]} ${emisionDate.getFullYear()}`
    : 'Fee Inicial';

  const createInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('facturacion').insert({
        id_proyecto: projectId,
        monto: parseFloat(monto),
        concepto: conceptoText,
        fecha_emision: fechaEmision,
        estado: 'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturacion', projectId] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
      toast({ title: 'Registro creado' });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isValid = monto && parseFloat(monto) > 0;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-5 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Nuevo registro de pago</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto</label>
          <select
            value={conceptoType}
            onChange={e => handleConceptChange(e.target.value as 'abono' | 'fee')}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground"
          >
            <option value="abono">Abono Mensual</option>
            <option value="fee">Fee Inicial</option>
          </select>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-mono truncate">{conceptoText}</p>
        </div>
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto</label>
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground"
          />
          {conceptoType === 'fee' && contrato && (
            <p className="text-[10px] sm:text-xs mt-1 font-mono text-warning">
              Rest: ${Math.max(0, feeInicialRestante - (parseFloat(monto) || 0)).toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha emisión</label>
          <input
            type="date"
            value={fechaEmision}
            onChange={e => setFechaEmision(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => createInvoice.mutate()}
          disabled={!isValid || createInvoice.isPending}
          className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createInvoice.isPending ? 'Creando...' : 'Crear registro'}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Copy button with green flash animation ── */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copiado al portapapeles' });
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={handleCopy}
      style={{ transform: copied ? 'scale(1.25)' : 'scale(1)' }}
      className={cn(
        'shrink-0 p-1.5 rounded-md transition-all duration-300 ease-out',
        copied
          ? 'text-success bg-success/15'
          : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-foreground/5'
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

/* ── Version field with bump button ── */
function VersionField({ client }: { client: any }) {
  const queryClient = useQueryClient();
  const [bumping, setBumping] = useState(false);

  const bumpVersion = async () => {
    const current = client.version || '1.0.0';
    const parts = current.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    const next = parts.join('.');
    setBumping(true);
    const { error } = await supabase.from('proyectos').update({ version: next } as any).eq('id', client.id);
    setBumping(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['proyecto', client.id] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      toast({ title: `Versión actualizada a v${next}` });
    }
  };

  return (
    <div>
      <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Versión</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs sm:text-sm text-foreground font-mono">v{client.version || '1.0.0'}</p>
        <button
          onClick={bumpVersion}
          disabled={bumping}
          className="p-0.5 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-150 disabled:opacity-50"
          title="Subir versión"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}


/* ── API Vault Tab ── */
function ApiVaultTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingToken, setEditingToken] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', key: '' });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['apis_tokens', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apis_tokens' as any)
        .select('*')
        .eq('id_proyecto', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { nombre: string; key: string }) => {
      const { error } = await supabase.from('apis_tokens' as any).insert({
        id_proyecto: projectId,
        nombre: payload.nombre,
        key: payload.key,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis_tokens', projectId] });
      toast({ title: 'API key guardada' });
      setShowForm(false);
      setForm({ nombre: '', key: '' });
    },
    onError: () => toast({ title: 'Error al guardar', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nombre, key }: { id: string; nombre: string; key: string }) => {
      const { error } = await supabase.from('apis_tokens' as any).update({ nombre, key } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis_tokens', projectId] });
      toast({ title: 'API key actualizada' });
      setEditingToken(null);
      setForm({ nombre: '', key: '' });
    },
    onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apis_tokens' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis_tokens', projectId] });
      toast({ title: 'API key eliminada' });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (token: any) => {
    setEditingToken(token);
    setForm({ nombre: token.nombre, key: token.key });
    setMenuOpen(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.key) return;
    if (editingToken) {
      updateMutation.mutate({ id: editingToken.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingToken(null);
    setForm({ nombre: '', key: '' });
  };

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          API Vault
        </h2>
        {!showForm && !editingToken && (
          <button
            onClick={() => setShowForm(true)}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Plus size={12} />
            Agregar
          </button>
        )}
      </div>

      {/* Form */}
      {(showForm || editingToken) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">{editingToken ? 'Editar API key' : 'Nueva API key'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: OpenAI API Key"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key</label>
                <input
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  placeholder="sk-..."
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={cancelForm} className="px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Token cards */}
      {(!tokens || tokens.length === 0) && !showForm && !editingToken ? (
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <KeyRound size={20} className="text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-muted-foreground text-xs sm:text-sm">No hay claves API configuradas.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-1">Agrega tus API keys y tokens aquí.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tokens?.map(token => {
            const isRevealed = revealedIds.has(token.id);
            return (
              <div key={token.id} className="glass-card p-4 sm:p-5 space-y-3 relative group">
                {/* Menu button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setMenuOpen(menuOpen === token.id ? null : token.id)}
                    className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/5 transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {menuOpen === token.id && (
                    <div className="absolute right-0 top-7 z-10 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                      <button
                        onClick={() => startEdit(token)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                      <button
                        onClick={() => { deleteMutation.mutate(token.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="text-xs sm:text-sm font-semibold text-foreground pr-8">{token.nombre}</p>

                {/* Key with blur */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs sm:text-sm font-mono text-muted-foreground truncate transition-all duration-200',
                      !isRevealed && 'blur-sm select-none'
                    )}>
                      {token.key}
                    </p>
                  </div>
                  <CopyButton value={token.key} />
                  <button
                    onClick={() => toggleReveal(token.id)}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-foreground/5 transition-colors"
                  >
                    {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Created date */}
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  {new Date(token.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Tareas Tab ── */
function TareasTab({ projectId }: { projectId: string }) {
  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('id_proyecto', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <ListTodo size={14} className="text-muted-foreground" />
          Tareas del proyecto
        </h2>
        <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">{tareas?.length ?? 0} tareas</span>
      </div>
      {/* Mobile: card layout, Desktop: table */}
      <div className="relative z-10 hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/5">
              <th className="py-2 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Título</th>
              <th className="py-2 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="py-2 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entrega</th>
              <th className="py-2 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Registrada</th>
            </tr>
          </thead>
          <tbody>
            {(!tareas || tareas.length === 0) ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No hay tareas registradas para este proyecto.
                </td>
              </tr>
            ) : (
              tareas.map(task => (
                <tr key={task.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150">
                  <td className="py-3 px-4 text-sm text-foreground">{task.titulo}</td>
                  <td className="py-3 px-4"><StatusBadge status={task.estado as any} /></td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES') : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {new Date(task.fecha_registro).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-foreground/5">
        {(!tareas || tareas.length === 0) ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No hay tareas registradas.
          </div>
        ) : (
          tareas.map(task => (
            <div key={task.id} className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-foreground leading-snug">{task.titulo}</p>
                <StatusBadge status={task.estado as any} />
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span>Entrega: {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES') : '—'}</span>
                <span>{new Date(task.fecha_registro).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientDetailPage;
