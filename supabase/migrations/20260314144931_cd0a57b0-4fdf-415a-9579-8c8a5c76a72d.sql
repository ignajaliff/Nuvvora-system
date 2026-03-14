
CREATE TABLE public.proyectos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_empresa TEXT NOT NULL,
  nombre_cliente TEXT,
  estado TEXT NOT NULL DEFAULT 'development' CHECK (estado IN ('development', 'maintenance', 'staging')),
  cliente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  stack TEXT,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on proyectos"
  ON public.proyectos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on proyectos"
  ON public.proyectos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update on proyectos"
  ON public.proyectos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on proyectos"
  ON public.proyectos FOR DELETE
  TO anon, authenticated
  USING (true);
