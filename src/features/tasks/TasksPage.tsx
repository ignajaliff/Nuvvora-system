import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';

const TasksPage = () => {
  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: api.getTasks, ...queryConfig });

  const groupedTasks = {
    in_progress: tasks?.filter(t => t.status === 'in_progress') ?? [],
    todo: tasks?.filter(t => t.status === 'todo') ?? [],
    done: tasks?.filter(t => t.status === 'done') ?? [],
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
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={status as 'in_progress' | 'todo' | 'done'} />
                <span className="text-[11px] text-muted-foreground font-mono-tabular">{statusTasks.length}</span>
              </div>
              <div className="rounded-xl shadow-card overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {statusTasks.map(task => (
                      <tr key={task.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
                        <td className="py-2.5 px-4 text-ui text-foreground">{task.title}</td>
                        <td className="py-2.5 px-4 text-ui text-muted-foreground">{task.projectName}</td>
                        <td className="py-2.5 px-4"><StatusBadge status={task.priority} /></td>
                        <td className="py-2.5 px-4 font-mono-tabular text-[12px] text-muted-foreground">{task.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
