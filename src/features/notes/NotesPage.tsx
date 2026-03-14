import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { SkeletonCard } from '@/components/shared/Skeleton';

const NotesPage = () => {
  const { data: notes, isLoading } = useQuery({ queryKey: ['notes'], queryFn: api.getNotes, ...queryConfig });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notas</h1>
          <p className="text-muted-foreground text-ui mt-1">Tus notas y apuntes rápidos</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
          Nueva nota
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {notes?.map(note => (
            <div key={note.id} className="rounded-xl p-5 shadow-card hover:shadow-card-hover hover:bg-muted/30 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{note.title}</span>
                {note.linkedTo && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{note.linkedTo}</span>
                )}
              </div>
              <p className="text-ui text-muted-foreground line-clamp-2">{note.content}</p>
              <div className="mt-3 text-[11px] text-muted-foreground font-mono-tabular">{note.updatedAt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPage;
