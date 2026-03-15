import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const usePrefetchAll = () => {
  const queryClient = useQueryClient();
  const { isReady, user } = useAuth();

  useEffect(() => {
    // Only prefetch when auth is ready and user is logged in
    if (!isReady || !user) return;

    queryClient.prefetchQuery({
      queryKey: ['proyectos'],
      queryFn: async () => {
        const { data, error } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      staleTime: STALE_TIME,
    });
  }, [queryClient, isReady, user]);
};

export const queryConfig = {
  staleTime: STALE_TIME,
  gcTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
};

export const PrefetchProvider = ({ children }: { children: React.ReactNode }) => {
  usePrefetchAll();
  return <>{children}</>;
};
