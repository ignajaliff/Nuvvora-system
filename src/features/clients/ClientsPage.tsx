import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const emptyForm = {
  nombre_empresa: '',
  nombre_cliente: '',
  estado: 'development',
  cliente_desde: new Date().toISOString().split('T')[0],
  stack: '',
  version: '1.0.0',
  link1: '',
  link2: '',
};

const ClientsPage = () => {
  const { data: clients, isLoading } = useQuery({ queryKey: ['proyectos'], queryFn: fetchProyectos });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create dialog
  const [open, setOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setEditLogoFile(file); setEditLogoPreview(URL.createObjectURL(file)); }
  };

  const createMutation = useMutation({
    mutationFn: async (newClient: typeof form) => {
      let logoPath: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }
      const { error } = await supabase.from('proyectos').insert([{ ...newClient, logo_empresa: logoPath }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setOpen(false);
      setForm({ ...emptyForm });
      setLogoFile(null);
      setLogoPreview(null);
      toast({ title: 'Cliente creado', description: 'El cliente se ha agregado correctamente.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
      let logoPath: string | undefined = undefined;
      if (editLogoFile) {
        const ext = editLogoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, editLogoFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }
      const updateData: any = { ...data };
      if (logoPath !== undefined) updateData.logo_empresa = logoPath;
      const { error } = await supabase.from('proyectos').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setEditOpen(false);
      setEditId(null);
      setEditLogoFile(null);
      setEditLogoPreview(null);
      toast({ title: 'Cliente actualizado', description: 'Los cambios se han guardado.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      toast({ title: 'Cliente eliminado' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_empresa.trim()) return;
    createMutation.mutate(form);
  };

  const handleEdit = (client: any) => {
    setEditId(client.id);
    setEditForm({
      nombre_empresa: client.nombre_empresa,
      nombre_cliente: client.nombre_cliente || '',
      estado: client.estado,
      cliente_desde: client.cliente_desde,
      stack: client.stack || '',
      version: client.version || '1.0.0',
      link1: client.link1 || '',
      link2: client.link2 || '',
    });
    setEditLogoPreview(client.logo_empresa ? getLogoUrl(client.logo_empresa) : null);
    setEditLogoFile(null);
    setEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm.nombre_empresa.trim()) return;
    updateMutation.mutate({ id: editId, data: editForm });
  };

  const renderForm = (
    formData: typeof form,
    setFormData: React.Dispatch<React.SetStateAction<typeof form>>,
    preview: string | null,
    inputRef: React.RefObject<HTMLInputElement>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onSubmit: (e: React.FormEvent) => void,
    isPending: boolean,
    submitLabel: string,
  ) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Logo de la empresa</Label>
        <div
          onClick={() => inputRef.current?.click()}
          className="h-16 w-16 rounded-lg border-2 border-dashed border-border bg-white flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Logo preview" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-[11px] text-muted-foreground text-center leading-tight">+ Logo</span>
          )}
        </div>
        <input ref={inputRef as any} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
      <div className="space-y-2">
        <Label>Nombre de la empresa *</Label>
        <Input value={formData.nombre_empresa} onChange={e => setFormData(f => ({ ...f, nombre_empresa: e.target.value }))} placeholder="Ej: TechCorp" required />
      </div>
      <div className="space-y-2">
        <Label>Nombre del cliente</Label>
        <Input value={formData.nombre_cliente} onChange={e => setFormData(f => ({ ...f, nombre_cliente: e.target.value }))} placeholder="Ej: Carlos Mendez" />
      </div>
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={formData.estado} onValueChange={v => setFormData(f => ({ ...f, estado: v }))}>
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
        <Label>Cliente desde</Label>
        <Input type="date" value={formData.cliente_desde} onChange={e => setFormData(f => ({ ...f, cliente_desde: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Stack</Label>
        <Input value={formData.stack} onChange={e => setFormData(f => ({ ...f, stack: e.target.value }))} placeholder="Ej: React + Vite" />
      </div>
      <div className="space-y-2">
        <Label>Versión</Label>
        <Input value={formData.version} onChange={e => setFormData(f => ({ ...f, version: e.target.value }))} placeholder="Ej: 1.0.0" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-ui font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );

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
            <DialogHeader><DialogTitle>Nuevo Cliente</DialogTitle></DialogHeader>
            {renderForm(form, setForm, logoPreview, fileInputRef, handleLogoChange, handleCreate, createMutation.isPending, 'Crear cliente')}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {renderForm(editForm, setEditForm, editLogoPreview, editFileInputRef, handleEditLogoChange, handleUpdate, updateMutation.isPending, 'Guardar cambios')}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : clients && clients.length > 0 ? (
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {clients.map(client => (
            <motion.div key={client.id} variants={fadeUp} className="glass-card p-6 cursor-pointer group relative hover:shadow-md transition-shadow" onClick={() => navigate(`/clients/${client.id}`)}>
              {/* 3-dot menu */}
              <div className="absolute top-4 right-4 z-20" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(client)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(client.id)}>Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="h-14 w-14 rounded-lg border border-border bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  {client.logo_empresa ? (
                    <img src={getLogoUrl(client.logo_empresa)} alt={`${client.nombre_empresa} logo`} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">{client.nombre_empresa.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-foreground leading-tight">{client.nombre_empresa}</h3>

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
