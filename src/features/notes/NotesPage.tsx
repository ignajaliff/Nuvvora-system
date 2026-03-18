import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { queryConfig } from '@/providers/PrefetchProvider';
import { fadeUp, stagger } from '@/lib/animations';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { Plus, StickyNote } from 'lucide-react';
import { toast } from 'sonner';

const NotesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    ...queryConfig,
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .insert({ titulo: 'Nueva nota', contenido: '' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notas'] });
      navigate(`/notes/${data.id}`);
    },
    onError: () => toast.error('Error al crear la nota'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notas</h1>
          <p className="text-muted-foreground text-ui mt-1">Tus notas y apuntes rápidos</p>
        </div>
        <button
          onClick={() => createNote.mutate()}
          disabled={createNote.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nueva nota
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !notes?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No hay notas aún</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Crea tu primera nota para empezar</p>
        </div>
      ) : (
        <motion.div className="grid grid-cols-2 gap-4" initial="hidden" animate="show" variants={stagger}>
          {notes.map(note => (
            <motion.div
              key={note.id}
              variants={fadeUp}
              className="glass-card p-5 cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all"
              onClick={() => navigate(`/notes/${note.id}`)}
            >
              <div className="relative z-10">
                <span className="font-medium text-foreground line-clamp-1">{note.titulo || 'Sin título'}</span>
                <p className="text-ui text-muted-foreground line-clamp-2 mt-1">{note.contenido || 'Sin contenido'}</p>
                <div className="mt-3 text-[11px] text-muted-foreground font-mono-tabular">
                  {new Date(note.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default NotesPage;
