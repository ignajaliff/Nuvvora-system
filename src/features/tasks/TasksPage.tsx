import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const TasksPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    id_proyecto: '',
    entrega_programada: '',
    estado: 'todo',
  });

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

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('proyectos').select('id, nombre_empresa').order('nombre_empresa');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tareas').insert({
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        id_proyecto: form.id_proyecto,
        entrega_programada: form.entrega_programada || null,
        estado: form.estado,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Tarea creada correctamente');
      setOpen(false);
      setForm({ titulo: '', descripcion: '', id_proyecto: '', entrega_programada: '', estado: 'todo' });
    },
    onError: () => toast.error('Error al crear la tarea'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.id_proyecto) {
      toast.error('Título y proyecto son obligatorios');
      return;
    }
    createMutation.mutate();
  };

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
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150"
        >
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

      {/* Dialog Nueva Tarea */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Diseñar landing page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto *</Label>
              <Select value={form.id_proyecto} onValueChange={v => setForm(f => ({ ...f, id_proyecto: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {proyectos?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Describe la tarea..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entrega">Entrega programada</Label>
                <Input
                  id="entrega"
                  type="date"
                  value={form.entrega_programada}
                  onChange={e => setForm(f => ({ ...f, entrega_programada: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger>
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
