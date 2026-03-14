import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';

const ProjectsPage = () => {
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: api.getProjects, ...queryConfig });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground text-ui mt-1">Todos tus proyectos activos y completados</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
          Nuevo proyecto
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects?.map(project => (
            <div key={project.id} className="rounded-xl p-5 shadow-card hover:shadow-card-hover hover:bg-muted/30 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">{project.name}</span>
                <StatusBadge status={project.status} />
              </div>
              <span className="text-[12px] text-muted-foreground">{project.clientName}</span>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Progreso</span>
                <span className="font-mono-tabular">{project.progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden mt-1">
                <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Vence: <span className="font-mono-tabular">{project.dueDate}</span></span>
                <span className="font-mono-tabular">${project.budget.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
