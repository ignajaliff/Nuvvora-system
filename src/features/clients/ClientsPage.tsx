import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/animations';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

function formatClientSince(dateStr: string) {
  const date = new Date(dateStr);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

const fetchProyectos = async () => {
  const { data, error } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const ClientsPage = () => {
  const { data: clients, isLoading } = useQuery({ queryKey: ['proyectos'], queryFn: fetchProyectos });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre_empresa: '',
    nombre_cliente: '',
    estado: 'development' as string,
    cliente_desde: new Date().toISOString().split('T')[0],
    stack: '',
    version: '1.0.0',
  });

  const mutation = useMutation({
    mutationFn: async (newClient: typeof form) => {
      const { error } = await supabase.from('proyectos').insert([newClient]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setOpen(false);
      setForm({ nombre_empresa: '', nombre_cliente: '', estado: 'development', cliente_desde: new Date().toISOString().split('T')[0], stack: '', version: '1.0.0' });
      toast({ title: 'Cliente creado', description: 'El cliente se ha agregado correctamente.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_empresa.trim()) return;
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-ui mt-1">Gestiona tus clientes y contactos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150">
              Nuevo cliente
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">Nombre de la empresa *</Label>
                <Input id="nombre_empresa" value={form.nombre_empresa} onChange={e => setForm(f => ({ ...f, nombre_empresa: e.target.value }))} placeholder="Ej: TechCorp" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_cliente">Nombre del cliente</Label>
                <Input id="nombre_cliente" value={form.nombre_cliente} onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))} placeholder="Ej: Carlos Mendez" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="development">En Desarrollo</SelectItem>
                    <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                    <SelectItem value="staging">Staging / Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente_desde">Cliente desde</Label>
                <Input id="cliente_desde" type="date" value={form.cliente_desde} onChange={e => setForm(f => ({ ...f, cliente_desde: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stack">Stack</Label>
                <Input id="stack" value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} placeholder="Ej: React + Vite" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="Ej: 1.0.0" />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {mutation.isPending ? 'Guardando...' : 'Crear cliente'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : clients && clients.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {clients.map(client => (
            <motion.div
              key={client.id}
              variants={fadeUp}
              className="glass-card p-5 cursor-pointer group"
            >
              <div className="relative z-10 flex flex-col gap-4">
                <div className="h-12 w-12 rounded-lg border border-border bg-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {client.nombre_empresa.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                  {client.nombre_empresa}
                </h3>

                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Estado:</span>
                    <StatusBadge status={client.estado as any} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cliente desde:</span>
                    <span className="text-foreground">{formatClientSince(client.cliente_desde)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] mt-auto pt-2 border-t border-border/50">
                  <span className="text-muted-foreground font-mono">{client.stack || '—'}</span>
                  <span className="text-muted-foreground font-mono">v{client.version || '1.0.0'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-ui">No hay clientes aún.</p>
          <p className="text-muted-foreground text-[13px] mt-1">Haz clic en "Nuevo cliente" para agregar el primero.</p>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
