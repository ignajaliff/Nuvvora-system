import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
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

function getLogoUrl(path: string) {
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return data.publicUrl;
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nombre_empresa: '',
    nombre_cliente: '',
    estado: 'development' as string,
    cliente_desde: new Date().toISOString().split('T')[0],
    stack: '',
    version: '1.0.0',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: async (newClient: typeof form) => {
      let logoPath: string | null = null;

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      const { error } = await supabase.from('proyectos').insert([{ ...newClient, logo_empresa: logoPath }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setOpen(false);
      setForm({ nombre_empresa: '', nombre_cliente: '', estado: 'development', cliente_desde: new Date().toISOString().split('T')[0], stack: '', version: '1.0.0' });
      setLogoFile(null);
      setLogoPreview(null);
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
              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Logo de la empresa</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 w-16 rounded-lg border-2 border-dashed border-border bg-white flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground text-center leading-tight">+ Logo</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : clients && clients.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {clients.map(client => (
            <motion.div
              key={client.id}
              variants={fadeUp}
              className="glass-card p-6 cursor-pointer group"
            >
              <div className="relative z-10 flex flex-col gap-4">
                {/* Logo */}
                <div className="h-14 w-14 rounded-lg border border-border bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  {client.logo_empresa ? (
                    <img
                      src={getLogoUrl(client.logo_empresa)}
                      alt={`${client.nombre_empresa} logo`}
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {client.nombre_empresa.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {client.nombre_empresa}
                </h3>

                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Estado:</span>
                    <StatusBadge status={client.estado as any} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cliente desde:</span>
                    <span className="text-foreground">{formatClientSince(client.cliente_desde)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] mt-auto pt-3 border-t border-border/50">
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
