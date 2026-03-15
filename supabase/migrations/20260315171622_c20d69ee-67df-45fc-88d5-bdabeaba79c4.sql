
-- Create apis_tokens table
CREATE TABLE public.apis_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_proyecto uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apis_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read apis_tokens"
ON public.apis_tokens FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert apis_tokens"
ON public.apis_tokens FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update apis_tokens"
ON public.apis_tokens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete apis_tokens"
ON public.apis_tokens FOR DELETE TO authenticated USING (true);
