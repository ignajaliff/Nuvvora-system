import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { Users, FolderKanban, CheckSquare, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, trend, trendValue }: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
}) => (
  <motion.div variants={fadeUp} className="glass-card p-5 cursor-pointer">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label text-muted-foreground">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
          <Icon size={14} className="text-muted-foreground" strokeWidth={1.8} />
        </div>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' ? (
            <ArrowUpRight size={12} className="text-success" />
          ) : (
            <ArrowDownRight size={12} className="text-destructive" />
          )}
          <span className="text-[11px] text-muted-foreground">{trendValue}</span>
        </div>
      )}
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const { data: clients, isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: api.getClients, ...queryConfig });
  const { data: projects, isLoading: loadingProjects } = useQuery({ queryKey: ['projects'], queryFn: api.getProjects, ...queryConfig });
  const { data: tasks, isLoading: loadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: api.getTasks, ...queryConfig });
  const { data: invoices, isLoading: loadingInvoices } = useQuery({ queryKey: ['invoices'], queryFn: api.getInvoices, ...queryConfig });

  const isLoading = loadingClients || loadingProjects || loadingTasks || loadingInvoices;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-ui mt-1">Resumen de tu actividad</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const activeClients = clients?.filter(c => c.status === 'development' || c.status === 'maintenance').length ?? 0;
  const activeProjects = projects?.filter(p => p.status === 'in_progress').length ?? 0;
  const pendingTasks = tasks?.filter(t => t.status !== 'done').length ?? 0;
  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-ui mt-1">Resumen de tu actividad</p>
      </div>

      <motion.div className="grid grid-cols-4 gap-4" initial="hidden" animate="show" variants={stagger}>
        <StatCard label="Clientes activos" value={String(activeClients)} icon={Users} trend="up" trendValue="+2 este mes" />
        <StatCard label="Proyectos activos" value={String(activeProjects)} icon={FolderKanban} trend="up" trendValue="3 en progreso" />
        <StatCard label="Tareas pendientes" value={String(pendingTasks)} icon={CheckSquare} trend="down" trendValue="2 completadas hoy" />
        <StatCard label="Ingresos" value={`$${totalRevenue.toLocaleString()}`} icon={Receipt} trend="up" trendValue="+15% vs Q anterior" />
      </motion.div>

      <div>
        <h2 className="text-sm font-medium mb-3 text-foreground">Proyectos recientes</h2>
        <motion.div className="grid grid-cols-3 gap-4" initial="hidden" animate="show" variants={stagger}>
          {projects?.filter(p => p.status === 'in_progress').map(project => (
            <motion.div key={project.id} variants={fadeUp} className="glass-card p-5 cursor-pointer">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground text-ui">{project.name}</span>
                  <StatusBadge status={project.status} />
                </div>
                <span className="text-[11px] text-muted-foreground">{project.clientName}</span>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progreso</span>
                    <span className="font-mono-tabular">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/80 transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <h2 className="text-sm font-medium mb-3 text-foreground">Tareas recientes</h2>
        <div className="glass-card overflow-hidden">
          <div className="relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/5">
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Tarea</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Proyecto</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Prioridad</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Estado</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tasks?.slice(0, 5).map(task => (
                  <tr key={task.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer">
                    <td className="py-3 px-4 text-ui text-foreground">{task.title}</td>
                    <td className="py-3 px-4 text-ui text-muted-foreground">{task.projectName}</td>
                    <td className="py-3 px-4"><StatusBadge status={task.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={task.status} /></td>
                    <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">{task.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
