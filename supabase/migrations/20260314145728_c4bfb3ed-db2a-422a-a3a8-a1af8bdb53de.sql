
ALTER TABLE public.proyectos ADD COLUMN logo_empresa TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

CREATE POLICY "Allow public read logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Allow public upload logos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow public update logos"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow public delete logos"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'logos');
