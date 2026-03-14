import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const usePrefetchAll = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['clients'], queryFn: api.getClients, staleTime: STALE_TIME });
    queryClient.prefetchQuery({ queryKey: ['projects'], queryFn: api.getProjects, staleTime: STALE_TIME });
    queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: api.getTasks, staleTime: STALE_TIME });
    queryClient.prefetchQuery({ queryKey: ['notes'], queryFn: api.getNotes, staleTime: STALE_TIME });
    queryClient.prefetchQuery({ queryKey: ['invoices'], queryFn: api.getInvoices, staleTime: STALE_TIME });
  }, [queryClient]);
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
