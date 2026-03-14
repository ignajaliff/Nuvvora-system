import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';

const TasksPage = () => {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas')
        .select('*, proyectos(nombre_empresa)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const groupedTasks = {
    in_progress: tasks?.filter(t => t.estado === 'in_progress') ?? [],
    todo: tasks?.filter(t => t.estado === 'todo') ?? [],
    done: tasks?.filter(t => t.estado === 'done') ?? [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground text-ui mt-1">Organiza y gestiona tu trabajo</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
          Nueva tarea
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={7} cols={5} />
      ) : (
        <motion.div className="space-y-6" initial="hidden" animate="show" variants={stagger}>
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <motion.div key={status} variants={fadeUp}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={status as 'in_progress' | 'todo' | 'done'} />
                <span className="text-[11px] text-muted-foreground font-mono-tabular">{statusTasks.length}</span>
              </div>
              <div className="glass-card overflow-hidden">
                <div className="relative z-10">
                  <table className="w-full">
                    <tbody>
                      {statusTasks.length === 0 ? (
                        <tr>
                          <td className="py-6 px-4 text-center text-sm text-muted-foreground" colSpan={4}>
                            Sin tareas en esta categoría
                          </td>
                        </tr>
                      ) : (
                        statusTasks.map(task => (
                          <tr key={task.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer">
                            <td className="py-3 px-4 text-ui text-foreground">{task.titulo}</td>
                            <td className="py-3 px-4 text-ui text-muted-foreground">{(task.proyectos as any)?.nombre_empresa ?? '—'}</td>
                            <td className="py-3 px-4"><StatusBadge status={task.estado as any} /></td>
                            <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">
                              {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES') : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TasksPage;
