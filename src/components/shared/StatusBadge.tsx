import { cn } from '@/lib/utils';

type StatusType = 'active' | 'inactive' | 'in_progress' | 'completed' | 'paused' | 'todo' | 'done' | 'draft' | 'sent' | 'paid' | 'overdue' | 'low' | 'medium' | 'high' | 'development' | 'maintenance' | 'staging' | 'pendiente' | 'pagado' | 'vencido' | 'propuesta' | 'activo' | 'suspendido';

const statusStyles: Record<StatusType, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  done: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  todo: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  development: 'bg-warning/10 text-warning',
  maintenance: 'bg-success/10 text-success',
  staging: 'bg-warning/10 text-warning',
  pendiente: 'bg-warning/10 text-warning',
  pagado: 'bg-success/10 text-success',
  vencido: 'bg-destructive/10 text-destructive',
  propuesta: 'bg-muted text-muted-foreground',
  activo: 'bg-success/10 text-success',
  suspendido: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<StatusType, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  in_progress: 'En progreso',
  completed: 'Completado',
  done: 'Hecho',
  paused: 'Pausado',
  todo: 'Pendiente',
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  development: 'En Desarrollo',
  maintenance: 'En Mantenimiento',
  staging: 'Staging / Testing',
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
  propuesta: 'Propuesta',
  activo: 'Activo',
  suspendido: 'Suspendido',
};

export const StatusBadge = ({ status, className }: { status: StatusType; className?: string }) => (
  <span className={cn(
    'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
    statusStyles[status],
    className
  )}>
    {statusLabels[status]}
  </span>
);
