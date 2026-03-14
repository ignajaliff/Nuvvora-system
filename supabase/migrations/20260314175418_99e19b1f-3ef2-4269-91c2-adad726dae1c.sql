
CREATE TABLE public.gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descripcion TEXT NOT NULL DEFAULT '',
  monto NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'general',
  fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gastos" ON public.gastos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert gastos" ON public.gastos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gastos" ON public.gastos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete gastos" ON public.gastos FOR DELETE TO authenticated USING (true);
