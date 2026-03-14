import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, CreditCard, KeyRound, ListTodo, FileText } from 'lucide-react';
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
  { id: 'contrato', label: 'Contrato', icon: FileText },
  { id: 'payments', label: 'Historial de pagos', icon: CreditCard },
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
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/clients')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Clientes
      </button>

      {/* Header card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5">
          {/* Logo */}
          <div className="h-20 w-20 rounded-xl border border-border bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {client.logo_empresa ? (
              <img
                src={getLogoUrl(client.logo_empresa)}
                alt={`${client.nombre_empresa} logo`}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">
                {client.nombre_empresa.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {client.nombre_empresa}
              </h1>
              <StatusBadge status={client.estado as any} />
            </div>
            {client.nombre_cliente && (
              <p className="text-muted-foreground text-sm mt-1">{client.nombre_cliente}</p>
            )}
            <p className="text-muted-foreground text-xs font-mono mt-1.5">
              ID: {client.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-6 border-t border-border/50 pt-4">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === tabId
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <Icon size={16} />
              {label}
              {activeTab === tabId && (
                <motion.div
                  layoutId="client-tab-indicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-foreground rounded-full"
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
        {activeTab === 'contrato' && <ContratoTab projectId={client.id} />}
        {activeTab === 'payments' && <PaymentsTab projectId={client.id} />}
        {activeTab === 'api' && <ApiVaultTab />}
      </div>
    </motion.div>
  );
};

/* ── General Tab ── */
function GeneralTab({ client }: { client: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Organization Details - takes more space */}
      <div className="lg:col-span-3 glass-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Info size={16} className="text-muted-foreground" />
          Detalles de la organización
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa</p>
            <p className="text-sm text-foreground mt-1">{client.nombre_empresa}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contacto</p>
            <p className="text-sm text-foreground mt-1">{client.nombre_cliente || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente desde</p>
            <p className="text-sm text-foreground mt-1">{formatClientSince(client.cliente_desde)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
            <div className="mt-1">
              <StatusBadge status={client.estado as any} />
            </div>
          </div>
        </div>
      </div>

      {/* Tech info */}
      <div className="lg:col-span-2 glass-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound size={16} className="text-muted-foreground" />
          Información técnica
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stack</p>
            <p className="text-sm text-foreground font-mono mt-1">{client.stack || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Versión</p>
            <p className="text-sm text-foreground font-mono mt-1">v{client.version || '1.0.0'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Creado</p>
            <p className="text-sm text-foreground mt-1">
              {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Payments Tab ── */
function PaymentsTab() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <CreditCard size={16} className="text-muted-foreground" />
        Historial de pagos
      </h2>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">No hay registros de pago aún.</p>
        <p className="text-muted-foreground text-xs mt-1">Los pagos aparecerán aquí cuando se registren.</p>
      </div>
    </div>
  );
}

/* ── API Vault Tab ── */
function ApiVaultTab() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <KeyRound size={16} className="text-muted-foreground" />
        API Vault
      </h2>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">No hay claves API configuradas.</p>
        <p className="text-muted-foreground text-xs mt-1">Las claves API se gestionarán aquí.</p>
      </div>
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
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ListTodo size={16} className="text-muted-foreground" />
          Tareas del proyecto
        </h2>
        <span className="text-xs text-muted-foreground font-mono">{tareas?.length ?? 0} tareas</span>
      </div>
      <div className="relative z-10">
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
    </div>
  );
}

export default ClientDetailPage;
