import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const prefetchAll = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['proyectos'],
      queryFn: async () => {
        const { data, error } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ['tareas-dashboard'],
      queryFn: async () => {
        const { data, error } = await supabase.from('tareas').select('*, proyectos(nombre_empresa)').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ['facturacion-dashboard'],
      queryFn: async () => {
        const { data, error } = await supabase.from('facturacion').select('*');
        if (error) throw error;
        return data;
      },
    }),
  ]);
};

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'black' | 'gradient' | 'exit'>('black');
  const queryClient = useQueryClient();

  useEffect(() => {
    // Start prefetching immediately during splash
    prefetchAll(queryClient);

    const t1 = setTimeout(() => setPhase('gradient'), 1400);
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [queryClient]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl font-semibold tracking-tight select-none"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: phase === 'black' ? 'hsl(240, 10%, 3.9%)' : 'transparent',
              backgroundImage: phase === 'gradient'
                ? 'linear-gradient(135deg, #D4D8F8, #A5F3FC, #D0EBFC)'
                : 'none',
              backgroundClip: phase === 'gradient' ? 'text' : 'unset',
              WebkitBackgroundClip: phase === 'gradient' ? 'text' : 'unset',
              transition: 'color 0.5s ease, background-image 0.5s ease',
            }}
          >
            N<span style={{ fontStyle: 'italic' }}>uvvora</span>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
