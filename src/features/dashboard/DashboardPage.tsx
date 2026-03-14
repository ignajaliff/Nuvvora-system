import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { Users, CheckSquare, Eye, EyeOff } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [showIngresos, setShowIngresos] = useState(false);

  const { data: proyectos, isLoading: l1 } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tareas, isLoading: l2 } = useQuery({
    queryKey: ['tareas-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tareas').select('*, proyectos(nombre_empresa)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: facturas, isLoading: l3 } = useQuery({
    queryKey: ['facturacion-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facturacion').select('*');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = l1 || l2 || l3;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-ui mt-1">Resumen de tu actividad</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const clientesActivos = proyectos?.filter(p => p.estado === 'active').length ?? 0;
  const tareasPendientes = tareas?.filter(t => t.estado === 'todo' || t.estado === 'in_progress').length ?? 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const ingresosMes = facturas
    ?.filter(f => {
      if (f.estado !== 'pagado') return false;
      const d = new Date(f.fecha_pago || f.fecha_emision);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, f) => sum + Number(f.monto), 0) ?? 0;

  const proyectosEnDesarrollo = proyectos?.filter(p => p.estado === 'development') ?? [];
  const tareasItems = tareas?.filter(t => t.estado === 'todo' || t.estado === 'in_progress') ?? [];

  return (
    <motion.div className="space-y-8" initial="hidden" animate="show" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-ui mt-1">Resumen de tu actividad</p>
      </motion.div>

      {/* Top stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Clientes activos */}
        <div className="glass-card p-5">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label text-muted-foreground">Clientes activos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
                <Users size={14} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight text-foreground">{clientesActivos}</div>
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="glass-card p-5">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label text-muted-foreground">Tareas pendientes</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
                <CheckSquare size={14} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight text-foreground">{tareasPendientes}</div>
          </div>
        </div>

        {/* Ingresos del mes */}
        <div className="glass-card p-5">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label text-muted-foreground">Ingresos del mes</span>
              <button
                onClick={() => setShowIngresos(v => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
              >
                {showIngresos ? (
                  <EyeOff size={14} className="text-muted-foreground" strokeWidth={1.8} />
                ) : (
                  <Eye size={14} className="text-muted-foreground" strokeWidth={1.8} />
                )}
              </button>
            </div>
            <div className="relative">
              <AnimatePresence mode="wait">
                {showIngresos ? (
                  <motion.div
                    key="visible"
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(8px)' }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-semibold tracking-tight text-foreground"
                  >
                    ${ingresosMes.toLocaleString()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl font-semibold tracking-tight text-foreground select-none"
                    style={{ filter: 'blur(10px)' }}
                  >
                    ${ingresosMes.toLocaleString()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proyectos en Desarrollo */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-foreground">Proyectos en Desarrollo</h2>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-warning/15 text-warning text-[11px] font-semibold">
            {proyectosEnDesarrollo.length}
          </span>
        </div>
        {proyectosEnDesarrollo.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proyectosEnDesarrollo.map(project => (
              <div
                key={project.id}
                className="glass-card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/clients/${project.id}`)}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-ui truncate">{project.nombre_empresa}</span>
                    <StatusBadge status="development" />
                  </div>
                  {project.nombre_cliente && (
                    <span className="text-[11px] text-muted-foreground">{project.nombre_cliente}</span>
                  )}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>Progreso</span>
                      <span className="font-mono">{project.progreso ?? 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-warning transition-all duration-500"
                        style={{ width: `${project.progreso ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-muted-foreground text-sm">No hay proyectos en desarrollo.</p>
          </div>
        )}
      </motion.div>

      {/* Tareas Pendientes */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-foreground">Tareas Pendientes</h2>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
            {tareasItems.length}
          </span>
        </div>
        {tareasItems.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/5">
                    <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Tarea</th>
                    <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Proyecto</th>
                    <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Estado</th>
                    <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {tareasItems.slice(0, 8).map(task => (
                    <tr
                      key={task.id}
                      className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <td className="py-3 px-4 text-ui text-foreground">{task.titulo}</td>
                      <td className="py-3 px-4 text-ui text-muted-foreground">
                        {(task as any).proyectos?.nombre_empresa ?? '—'}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={task.estado as any} /></td>
                      <td className="py-3 px-4 font-mono text-[12px] text-muted-foreground">
                        {task.entrega_programada
                          ? new Date(task.entrega_programada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-muted-foreground text-sm">No hay tareas pendientes. 🎉</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardPage;