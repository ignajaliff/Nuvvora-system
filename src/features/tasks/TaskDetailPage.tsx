import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { ArrowLeft, Calendar, FolderOpen, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ['tarea', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas')
        .select('*, proyectos(nombre_empresa, logo_empresa)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateEstado = useMutation({
    mutationFn: async (estado: string) => {
      const { error } = await supabase.from('tareas').update({ estado }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarea', id] });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  if (isLoading) return <SkeletonTable rows={4} cols={2} />;
  if (!task) return <p className="text-muted-foreground p-8">Tarea no encontrada</p>;

  const proyecto = task.proyectos as any;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/tasks')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a tareas
      </button>

      <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
        {/* Header card */}
        <div className="glass-card p-6 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{task.titulo}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {proyecto?.nombre_empresa ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Registrada {new Date(task.fecha_registro).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
            <Select value={task.estado} onValueChange={v => updateEstado.mutate(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Pendiente</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="done">Hecho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 relative z-10">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Estado</p>
            <StatusBadge status={task.estado as any} />
          </div>
          <div className="glass-card p-4 relative z-10">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Entrega programada</p>
            <p className="text-sm font-medium text-foreground font-mono-tabular">
              {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}
            </p>
          </div>
          <div className="glass-card p-4 relative z-10">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Proyecto</p>
            <p className="text-sm font-medium text-foreground">{proyecto?.nombre_empresa ?? '—'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Descripción</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
              {task.descripcion || 'Sin descripción'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskDetailPage;
