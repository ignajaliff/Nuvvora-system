import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

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
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="glass-card overflow-hidden">
          <div className="relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/5">
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Nombre</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Empresa</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Estado</th>
                  <th className="text-label text-muted-foreground text-left py-3 px-4 font-semibold">Desde</th>
                </tr>
              </thead>
              <tbody>
                {clients?.map(client => (
                  <tr key={client.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer">
                    <td className="py-3 px-4 text-ui font-medium text-foreground">{client.name}</td>
                    <td className="py-3 px-4 text-ui text-muted-foreground">{client.company}</td>
                    <td className="py-3 px-4 text-ui text-muted-foreground">{client.email}</td>
                    <td className="py-3 px-4"><StatusBadge status={client.status} /></td>
                    <td className="py-3 px-4 font-mono-tabular text-[12px] text-muted-foreground">{client.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ClientsPage;
