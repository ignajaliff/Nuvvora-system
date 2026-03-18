
CREATE TABLE public.notas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL DEFAULT '',
  contenido text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notas" ON public.notas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notas" ON public.notas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notas" ON public.notas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete notas" ON public.notas FOR DELETE TO authenticated USING (true);
