
CREATE TABLE public.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
  entrega_programada date,
  estado text NOT NULL DEFAULT 'todo',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies (public access like proyectos)
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on tareas" ON public.tareas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on tareas" ON public.tareas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on tareas" ON public.tareas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on tareas" ON public.tareas FOR DELETE TO anon, authenticated USING (true);
