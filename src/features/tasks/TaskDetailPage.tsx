import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp } from '@/lib/animations';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { ArrowLeft, Calendar, FolderOpen, FileText, Trash2, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const statusTriggerStyles: Record<string, string> = {
  todo: 'bg-foreground text-background border-foreground hover:bg-foreground/90',
  in_progress: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/15',
  done: 'bg-success/10 text-success border-success/30 hover:bg-success/15',
};

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (task) setDescDraft(task.descripcion ?? '');
  }, [task]);

  useEffect(() => {
    if (isEditingDesc && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditingDesc]);

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

  const updateDesc = useMutation({
    mutationFn: async (descripcion: string) => {
      const { error } = await supabase.from('tareas').update({ descripcion }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarea', id] });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      setIsEditingDesc(false);
      toast.success('Descripción actualizada');
    },
    onError: () => toast.error('Error al actualizar descripción'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tareas').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Tarea eliminada');
      navigate('/tasks');
    },
    onError: () => toast.error('Error al eliminar la tarea'),
  });

  const handleSaveDesc = () => {
    if (descDraft !== (task?.descripcion ?? '')) {
      updateDesc.mutate(descDraft);
    } else {
      setIsEditingDesc(false);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={2} />;
  if (!task) return <p className="text-muted-foreground p-8">Tarea no encontrada</p>;

  const proyecto = task.proyectos as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tareas
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>

      <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
        <div className="glass-card p-6 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{task.titulo}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {proyecto?.nombre_empresa ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Registrada {new Date(task.fecha_registro).toLocaleDateString('es-ES')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Entrega: {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}
                </span>
              </div>
            </div>
            <Select value={task.estado} onValueChange={v => updateEstado.mutate(v)}>
              <SelectTrigger className={`w-[160px] ${statusTriggerStyles[task.estado] ?? ''}`}>
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

        <div className="glass-card p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Descripción</h2>
            </div>
            {isEditingDesc ? (
              <button
                onClick={handleSaveDesc}
                disabled={updateDesc.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {updateDesc.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingDesc(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Editar
              </button>
            )}
          </div>
          {isEditingDesc ? (
            <textarea
              ref={textareaRef}
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setDescDraft(task.descripcion ?? '');
                  setIsEditingDesc(false);
                }
              }}
              placeholder="Escribe una descripción..."
              className="w-full min-h-[120px] bg-transparent border border-border rounded-lg px-4 py-3 text-[15px] text-foreground leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          ) : (
            <div
              onClick={() => setIsEditingDesc(true)}
              className="prose prose-sm max-w-none cursor-pointer rounded-lg hover:bg-muted/30 transition-colors px-4 py-3 -mx-4 -my-3"
            >
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                {task.descripcion || 'Haz clic para agregar una descripción...'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea "{task.titulo}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskDetailPage;
