import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `${years} año${years > 1 ? 's' : ''}`;
  }
  return `${months} mes${months !== 1 ? 'es' : ''}`;
}

const ClientsPage = () => {
  const { data: clients, isLoading } = useQuery({ queryKey: ['clients'], queryFn: api.getClients, ...queryConfig });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-ui mt-1">Gestiona tus clientes y contactos</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
          Nuevo cliente
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {clients?.map(client => (
            <motion.div
              key={client.id}
              variants={fadeUp}
              className="glass-card p-5 cursor-pointer group"
            >
              <div className="relative z-10 flex flex-col gap-4">
                {/* Logo placeholder + status */}
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-lg border border-border bg-white flex items-center justify-center shadow-sm shrink-0">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {client.company.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                {/* Company & time */}
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                    {client.company}
                  </h3>
                  <p className="text-muted-foreground text-ui mt-1">
                    {client.name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-mono-tabular text-[12px]">
                    Hace {timeAgo(client.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ClientsPage;
