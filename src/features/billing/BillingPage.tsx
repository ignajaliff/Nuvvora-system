import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/mock-data';
import { queryConfig } from '@/providers/PrefetchProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/Skeleton';

const BillingPage = () => {
  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: api.getInvoices, ...queryConfig });

  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0) ?? 0;
  const totalPending = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground text-ui mt-1">Gestiona tus facturas e ingresos</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
          Nueva factura
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 shadow-card">
          <span className="text-label text-muted-foreground">Total cobrado</span>
          <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">${totalPaid.toLocaleString()}</div>
        </div>
        <div className="rounded-xl p-4 shadow-card">
          <span className="text-label text-muted-foreground">Pendiente</span>
          <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">${totalPending.toLocaleString()}</div>
        </div>
        <div className="rounded-xl p-4 shadow-card">
          <span className="text-label text-muted-foreground">Total facturas</span>
          <div className="text-2xl font-semibold tracking-tight mt-1 font-mono-tabular">{invoices?.length ?? 0}</div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <div className="rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-label text-muted-foreground text-left py-2.5 px-4 font-semibold">Cliente</th>
                <th className="text-label text-muted-foreground text-left py-2.5 px-4 font-semibold">Proyecto</th>
                <th className="text-label text-muted-foreground text-left py-2.5 px-4 font-semibold">Monto</th>
                <th className="text-label text-muted-foreground text-left py-2.5 px-4 font-semibold">Estado</th>
                <th className="text-label text-muted-foreground text-left py-2.5 px-4 font-semibold">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map(inv => (
                <tr key={inv.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
                  <td className="py-2.5 px-4 text-ui font-medium text-foreground">{inv.clientName}</td>
                  <td className="py-2.5 px-4 text-ui text-muted-foreground">{inv.projectName}</td>
                  <td className="py-2.5 px-4 font-mono-tabular text-foreground">${inv.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-4"><StatusBadge status={inv.status} /></td>
                  <td className="py-2.5 px-4 font-mono-tabular text-[12px] text-muted-foreground">{inv.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
