
-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to archive done tasks older than 7 days
CREATE OR REPLACE FUNCTION public.archive_old_done_tasks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tareas
  SET estado = 'resuelto_viejo'
  WHERE estado = 'done'
    AND created_at < now() - interval '7 days';
$$;
