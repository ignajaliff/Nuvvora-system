import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp } from '@/lib/animations';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { ArrowLeft, FileText, Trash2, Check } from 'lucide-react';
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

const NoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { data: note, isLoading } = useQuery({
    queryKey: ['nota', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (note) {
      setTitleDraft(note.titulo ?? '');
      setContentDraft(note.contenido ?? '');
    }
  }, [note]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
      contentRef.current.selectionStart = contentRef.current.value.length;
    }
  }, [isEditingContent]);

  const updateNote = useMutation({
    mutationFn: async (fields: { titulo?: string; contenido?: string }) => {
      const { error } = await supabase
        .from('notas')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nota', id] });
      queryClient.invalidateQueries({ queryKey: ['notas'] });
      toast.success('Nota actualizada');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notas').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas'] });
      toast.success('Nota eliminada');
      navigate('/notes');
    },
    onError: () => toast.error('Error al eliminar la nota'),
  });

  const handleSaveTitle = () => {
    if (titleDraft !== (note?.titulo ?? '')) {
      updateNote.mutate({ titulo: titleDraft });
    }
    setIsEditingTitle(false);
  };

  const handleSaveContent = () => {
    if (contentDraft !== (note?.contenido ?? '')) {
      updateNote.mutate({ contenido: contentDraft });
    }
    setIsEditingContent(false);
  };

  if (isLoading) return <SkeletonTable rows={4} cols={2} />;
  if (!note) return <p className="text-muted-foreground p-8">Nota no encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/notes')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a notas
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
        {/* Title */}
        <div className="glass-card p-6 relative z-10">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') { setTitleDraft(note.titulo ?? ''); setIsEditingTitle(false); }
              }}
              className="w-full text-2xl font-semibold tracking-tight text-foreground bg-transparent border-b-2 border-primary/40 focus:border-primary focus:outline-none pb-1"
              placeholder="Título de la nota..."
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl font-semibold tracking-tight text-foreground cursor-pointer hover:text-foreground/80 transition-colors"
              >
                {note.titulo || 'Sin título'}
              </h1>
              <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                {new Date(note.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="glass-card p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Contenido</h2>
            </div>
            {isEditingContent ? (
              <button
                onClick={handleSaveContent}
                disabled={updateNote.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {updateNote.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingContent(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Editar
              </button>
            )}
          </div>
          {isEditingContent ? (
            <textarea
              ref={contentRef}
              value={contentDraft}
              onChange={e => setContentDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setContentDraft(note.contenido ?? '');
                  setIsEditingContent(false);
                }
              }}
              placeholder="Escribe el contenido de tu nota..."
              className="w-full min-h-[200px] bg-transparent border border-border rounded-lg px-4 py-3 text-[15px] text-foreground leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          ) : (
            <div
              onClick={() => setIsEditingContent(true)}
              className="prose prose-sm max-w-none cursor-pointer rounded-lg hover:bg-muted/30 transition-colors px-4 py-3 -mx-4 -my-3"
            >
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                {note.contenido || 'Haz clic para agregar contenido...'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La nota "{note.titulo}" será eliminada permanentemente.
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

export default NoteDetailPage;
