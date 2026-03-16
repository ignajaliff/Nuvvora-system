import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { GripVertical, Zap, Filter } from 'lucide-react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { useIsMobile } from '@/hooks/use-mobile';

/* ── Responsive Modal: Drawer on mobile, Dialog on desktop ── */
function ResponsiveModal({ open, onOpenChange, title, titleIcon, children }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              {titleIcon}
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {titleIcon}
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ── Draggable task row (desktop) ── */
const DraggableTaskRow = ({ task, onClick }: { task: any; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const style = {
    transform: !isDragging && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.15 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[40px_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] items-center border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer"
      onClick={onClick}
    >
      <div className="py-3 px-2">
        <button
          {...listeners}
          {...attributes}
          onClick={e => e.stopPropagation()}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="py-3 px-4 text-ui text-foreground truncate">{task.titulo}</div>
      <div className="py-3 px-4 text-ui text-muted-foreground truncate">{(task.proyectos as any)?.nombre_empresa ?? '—'}</div>
      <div className="py-3 px-4"><StatusBadge status={task.estado as any} /></div>
      <div className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground whitespace-nowrap">
        {task.entrega_programada ? new Date(task.entrega_programada).toLocaleDateString('es-ES') : '—'}
      </div>
    </div>
  );
};

/* ── Mobile task card ── */
const MobileTaskCard = ({ task, onClick }: { task: any; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const style = {
    transform: !isDragging && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.15 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="p-3 border-b border-foreground/5 last:border-0 flex items-start gap-2" onClick={onClick}>
      <button {...listeners} {...attributes} onClick={e => e.stopPropagation()} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 mt-0.5 shrink-0 touch-none">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-foreground leading-snug">{task.titulo}</p>
          <StatusBadge status={task.estado as any} />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span className="truncate">{(task.proyectos as any)?.nombre_empresa ?? '—'}</span>
          {task.entrega_programada && (
            <span className="shrink-0">• {new Date(task.entrega_programada).toLocaleDateString('es-ES')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Droppable status column ── */
const DroppableColumn = ({ status, children }: { status: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`transition-all duration-200 rounded-xl ${isOver ? 'ring-2 ring-primary/30 bg-primary/[0.02]' : ''}`}>
      {children}
    </div>
  );
};

/* ── Overlay row ── */
const OverlayRow = ({ task }: { task: any }) => (
  <div className="p-3 rounded-lg shadow-lg flex items-center gap-3 bg-background border border-border max-w-xs">
    <GripVertical className="w-4 h-4 text-muted-foreground/40" />
    <span className="text-ui text-foreground truncate">{task.titulo}</span>
    <StatusBadge status={task.estado as any} />
  </div>
);

const ALL_STATUSES = ['todo', 'in_progress', 'done', 'resuelto_viejo'] as const;
const DEFAULT_VISIBLE = ['todo', 'in_progress', 'done'] as const;
const STATUS_ORDER = ['todo', 'in_progress', 'done'] as const;

const STATUS_FILTER_LABELS: Record<string, string> = {
  in_progress: 'En progreso',
  todo: 'Pendiente',
  done: 'Hecho',
  resuelto_viejo: 'Archivado',
};

const getDefaultDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
};

const TasksPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>([...DEFAULT_VISIBLE]);
  const [showFilter, setShowFilter] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', id_proyecto: '', entrega_programada: '', estado: 'todo',
  });
  const [quickForm, setQuickForm] = useState({
    titulo: '', descripcion: '', id_proyecto: '',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tareas').select('*, proyectos(nombre_empresa)').order('created_at', { ascending: false });
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
    mutationFn: async (payload: { titulo: string; descripcion: string; id_proyecto: string; entrega_programada: string; estado: string }) => {
      const { error } = await supabase.from('tareas').insert({
        titulo: payload.titulo,
        descripcion: payload.descripcion || null,
        id_proyecto: payload.id_proyecto,
        entrega_programada: payload.entrega_programada || null,
        estado: payload.estado,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Tarea creada correctamente');
    },
    onError: () => toast.error('Error al crear la tarea'),
  });

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from('tareas').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tareas'] }); toast.success('Estado actualizado'); },
    onError: () => toast.error('Error al actualizar estado'),
  });

  /* ── Handlers ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.id_proyecto) { toast.error('Título y proyecto son obligatorios'); return; }
    createMutation.mutate(form, {
      onSuccess: () => { setOpen(false); setForm({ titulo: '', descripcion: '', id_proyecto: '', entrega_programada: '', estado: 'todo' }); },
    });
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.titulo || !quickForm.id_proyecto) { toast.error('Graba un audio primero'); return; }
    createMutation.mutate(
      { ...quickForm, estado: 'todo', entrega_programada: getDefaultDeliveryDate() },
      { onSuccess: () => { setQuickOpen(false); setQuickForm({ titulo: '', descripcion: '', id_proyecto: '' }); } },
    );
  };

  const handleDragStart = (event: DragStartEvent) => { setActiveTask(event.active.data.current?.task); };
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
  const quickEmpresaName = proyectos?.find(p => p.id === quickForm.id_proyecto)?.nombre_empresa ?? '';

  const handleVoiceResult = (result: { titulo: string; descripcion: string }) => {
    setForm(f => ({ ...f, titulo: result.titulo, descripcion: result.descripcion, estado: 'todo', entrega_programada: getDefaultDeliveryDate() }));
  };

  const handleQuickVoiceResult = (result: { titulo: string; descripcion: string }) => {
    setQuickForm(f => ({ ...f, titulo: result.titulo, descripcion: result.descripcion }));
  };

  const displayStatuses = visibleStatuses.filter(s => ALL_STATUSES.includes(s as any));
  const groupedTasks: Record<string, any[]> = {};
  for (const s of displayStatuses) {
    groupedTasks[s] = tasks?.filter(t => t.estado === s) ?? [];
  }

  const toggleStatus = (status: string) => {
    setVisibleStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground text-[11px] sm:text-ui mt-0.5 sm:mt-1 hidden sm:block">Organiza y gestiona tu trabajo — arrastra tareas entre estados</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowFilter(f => !f)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-ui font-medium transition-all duration-150 flex items-center gap-1 sm:gap-1.5 border ${showFilter ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:text-foreground'}`}
          >
            <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button
            onClick={() => setQuickOpen(true)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-warning text-warning-foreground text-[11px] sm:text-ui font-medium hover:opacity-90 transition-opacity duration-150 flex items-center gap-1 sm:gap-1.5"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Tarea rápida</span>
            <span className="sm:hidden">Rápida</span>
          </button>
          <button
            onClick={() => setOpen(true)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-ui font-medium hover:opacity-90 transition-opacity duration-150"
          >
            <span className="hidden sm:inline">Nueva tarea</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {ALL_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-150 border ${
                visibleStatuses.includes(status)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {STATUS_FILTER_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={7} cols={5} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div className="space-y-4 sm:space-y-6" initial="hidden" animate="show" variants={stagger}>
            {displayStatuses.map(status => (
              <motion.div key={status} variants={fadeUp}>
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  {status === 'todo' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-foreground text-background">
                      Pendiente
                    </span>
                  ) : status === 'in_progress' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-warning/10 text-warning">
                      En progreso
                    </span>
                  ) : (
                    <StatusBadge status={status as any} />
                  )}
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground font-mono-tabular">{groupedTasks[status].length}</span>
                </div>
                <DroppableColumn status={status}>
                  <div className="glass-card overflow-hidden">
                    {/* Desktop list */}
                    <div className="relative z-10 hidden sm:block">
                      {groupedTasks[status].length === 0 ? (
                        <div className="py-6 px-4 text-center text-sm text-muted-foreground">Sin tareas — arrastra una aquí</div>
                      ) : (
                        groupedTasks[status].map(task => (
                          <DraggableTaskRow key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                        ))
                      )}
                    </div>
                    {/* Mobile card list */}
                    <div className="sm:hidden">
                      {groupedTasks[status].length === 0 ? (
                        <div className="py-5 px-3 text-center text-xs text-muted-foreground">Sin tareas — arrastra una aquí</div>
                      ) : (
                        groupedTasks[status].map(task => (
                          <MobileTaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                        ))
                      )}
                    </div>
                  </div>
                </DroppableColumn>
              </motion.div>
            ))}
          </motion.div>
          {typeof document !== 'undefined' ? createPortal(
            <DragOverlay dropAnimation={null} zIndex={50}>
              {activeTask ? <OverlayRow task={activeTask} /> : null}
            </DragOverlay>,
            document.body,
          ) : null}
        </DndContext>
      )}

      {/* Nueva Tarea */}
      <ResponsiveModal open={open} onOpenChange={setOpen} title="Nueva tarea">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-2">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="proyecto" className="text-xs sm:text-sm">Proyecto *</Label>
            <Select value={form.id_proyecto} onValueChange={v => setForm(f => ({ ...f, id_proyecto: v }))}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger>
              <SelectContent>{proyectos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="titulo" className="text-xs sm:text-sm">Título *</Label>
            <Input id="titulo" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Diseñar landing page" className="text-xs sm:text-sm" />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descripcion" className="text-xs sm:text-sm">Descripción</Label>
              <VoiceRecorder empresa={selectedEmpresaName} disabled={!form.id_proyecto} onResult={handleVoiceResult} />
            </div>
            <Textarea id="descripcion" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Describe la tarea o usa el micrófono..." rows={3} className="text-xs sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="entrega" className="text-xs sm:text-sm">Entrega</Label>
              <Input id="entrega" type="date" value={form.entrega_programada} onChange={e => setForm(f => ({ ...f, entrega_programada: e.target.value }))} className="text-xs sm:text-sm" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="estado" className="text-xs sm:text-sm">Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="done">Hecho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 sm:pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {createMutation.isPending ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Tarea Rápida */}
      <ResponsiveModal open={quickOpen} onOpenChange={setQuickOpen} title="Tarea rápida" titleIcon={<Zap className="w-4 h-4 text-warning" />}>
        <form onSubmit={handleQuickSubmit} className="space-y-3 sm:space-y-4 mt-2">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Proyecto *</Label>
            <Select value={quickForm.id_proyecto} onValueChange={v => setQuickForm(f => ({ ...f, id_proyecto: v }))}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger>
              <SelectContent>{proyectos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Descripción por voz</Label>
            {!quickForm.descripcion ? (
              <div className="flex items-center justify-center py-5 sm:py-6 rounded-lg border border-dashed border-border bg-muted/30">
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <VoiceRecorder empresa={quickEmpresaName} disabled={!quickForm.id_proyecto} onResult={handleQuickVoiceResult} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {quickForm.id_proyecto ? 'Toca el micrófono para dictar' : 'Selecciona un proyecto primero'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="rounded-lg bg-muted/30 border border-border p-2.5 sm:p-3">
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Título generado</span>
                  <p className="text-xs sm:text-sm text-foreground mt-1">{quickForm.titulo}</p>
                </div>
                <Textarea
                  value={quickForm.descripcion}
                  onChange={e => setQuickForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción..."
                  rows={3}
                  className="text-xs sm:text-sm"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setQuickForm(f => ({ ...f, titulo: '', descripcion: '' }))}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Volver a grabar
                  </button>
                  <VoiceRecorder empresa={quickEmpresaName} disabled={!quickForm.id_proyecto} onResult={handleQuickVoiceResult} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1 sm:pt-2">
            <button type="button" onClick={() => { setQuickOpen(false); setQuickForm({ titulo: '', descripcion: '', id_proyecto: '' }); }} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={createMutation.isPending || !quickForm.titulo}
              className="px-3 sm:px-4 py-1.5 rounded-lg bg-warning text-warning-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default TasksPage;
