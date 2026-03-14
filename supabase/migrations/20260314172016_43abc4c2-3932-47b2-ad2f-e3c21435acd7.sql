
-- Tabla de contratos por proyecto
CREATE TABLE public.contratos_proyecto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  fee_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  abono_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
  dia_facturacion INTEGER NOT NULL DEFAULT 1,
  moneda TEXT NOT NULL DEFAULT 'USD',
  estado_contrato TEXT NOT NULL DEFAULT 'propuesta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(id_proyecto)
);

-- RLS for contratos_proyecto
ALTER TABLE public.contratos_proyecto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contratos" ON public.contratos_proyecto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contratos" ON public.contratos_proyecto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contratos" ON public.contratos_proyecto FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete contratos" ON public.contratos_proyecto FOR DELETE TO authenticated USING (true);

-- Tabla de facturación
CREATE TABLE public.facturacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  concepto TEXT NOT NULL DEFAULT '',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for facturacion
ALTER TABLE public.facturacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read facturacion" ON public.facturacion FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert facturacion" ON public.facturacion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update facturacion" ON public.facturacion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete facturacion" ON public.facturacion FOR DELETE TO authenticated USING (true);
