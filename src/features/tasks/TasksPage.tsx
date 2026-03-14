import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
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
import { GripVertical } from 'lucide-react';
import { VoiceRecorder } from './components/VoiceRecorder';

/* ── Draggable task row ── */
const DraggableTaskRow = ({ task, onClick }: { task: any; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer"
      onClick={onClick}
    >
      <td className="py-3 px-2 w-8">
        <button
          {...listeners}
          {...attributes}
          onClick={e => e.stopPropagation()}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="py-3 px-4 text-ui text-foreground">{task.titulo}</td>
      <td className="py-3 px-4 text-ui text-muted-foreground">{(task.proyectos as any)?.nombre_empresa ?? '—'}</td>
      <td className="py-3 px-4"><StatusBadge status={task.estado as any} /></td>
      <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">
        {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES') : '—'}
      </td>
    </tr>
  );
};

/* ── Droppable status column ── */
const DroppableColumn = ({ status, children }: { status: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 rounded-xl ${isOver ? 'ring-2 ring-primary/30 bg-primary/[0.02]' : ''}`}
    >
      {children}
    </div>
  );
};

/* ── Overlay row (shown while dragging) ── */
const OverlayRow = ({ task }: { task: any }) => (
  <div className="glass-card p-3 rounded-lg shadow-lg flex items-center gap-3 relative z-10">
    <GripVertical className="w-4 h-4 text-muted-foreground/40" />
    <span className="text-ui text-foreground">{task.titulo}</span>
    <StatusBadge status={task.estado as any} />
  </div>
);

const STATUS_ORDER = ['in_progress', 'todo', 'done'] as const;

const getDefaultDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
};

const TasksPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    id_proyecto: '',
    entrega_programada: '',
    estado: 'todo',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from('tareas').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.id_proyecto) {
      toast.error('Título y proyecto son obligatorios');
      return;
    }
    createMutation.mutate();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = active.data.current?.task;
    const newStatus = over.id as string;
    if (task && STATUS_ORDER.includes(newStatus as any) && task.estado !== newStatus) {
      updateEstado.mutate({ id: task.id, estado: newStatus });
    }
  };

  const selectedEmpresaName = proyectos?.find(p => p.id === form.id_proyecto)?.nombre_empresa ?? '';

  const handleVoiceResult = (result: { titulo: string; descripcion: string }) => {
    setForm(f => ({
      ...f,
      titulo: result.titulo,
      descripcion: result.descripcion,
      estado: 'todo',
      entrega_programada: getDefaultDeliveryDate(),
    }));
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
          <p className="text-muted-foreground text-ui mt-1">Organiza y gestiona tu trabajo — arrastra tareas entre estados</p>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div className="space-y-6" initial="hidden" animate="show" variants={stagger}>
            {STATUS_ORDER.map(status => (
              <motion.div key={status} variants={fadeUp}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={status as any} />
                  <span className="text-[11px] text-muted-foreground font-mono-tabular">{groupedTasks[status].length}</span>
                </div>
                <DroppableColumn status={status}>
                  <div className="glass-card overflow-hidden">
                    <div className="relative z-10">
                      <table className="w-full">
                        <tbody>
                          {groupedTasks[status].length === 0 ? (
                            <tr>
                              <td className="py-6 px-4 text-center text-sm text-muted-foreground" colSpan={5}>
                                Sin tareas — arrastra una aquí
                              </td>
                            </tr>
                          ) : (
                            groupedTasks[status].map(task => (
                              <DraggableTaskRow
                                key={task.id}
                                task={task}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </DroppableColumn>
              </motion.div>
            ))}
          </motion.div>
          <DragOverlay>{activeTask ? <OverlayRow task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      )}

      {/* Dialog Nueva Tarea */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto *</Label>
              <Select value={form.id_proyecto} onValueChange={v => setForm(f => ({ ...f, id_proyecto: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger>
                <SelectContent>
                  {proyectos?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Diseñar landing page" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="descripcion">Descripción</Label>
                <VoiceRecorder
                  empresa={selectedEmpresaName}
                  disabled={!form.id_proyecto}
                  onResult={handleVoiceResult}
                />
              </div>
              <Textarea id="descripcion" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Describe la tarea o usa el micrófono para dictarla..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entrega">Entrega programada</Label>
                <Input id="entrega" type="date" value={form.entrega_programada} onChange={e => setForm(f => ({ ...f, entrega_programada: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="done">Hecho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
