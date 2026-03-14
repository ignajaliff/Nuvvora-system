import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const usePrefetchAll = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const resources = [
      { key: 'clients', fn: api.getClients },
      { key: 'projects', fn: api.getProjects },
      { key: 'tasks', fn: api.getTasks },
      { key: 'notes', fn: api.getNotes },
      { key: 'invoices', fn: api.getInvoices },
    ];

    resources.forEach(({ key, fn }) => {
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: fn,
        staleTime: STALE_TIME,
      });
    });
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
