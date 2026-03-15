
-- Schedule the archive function to run daily at 3 AM UTC
SELECT cron.schedule(
  'archive-old-done-tasks',
  '0 3 * * *',
  $$SELECT public.archive_old_done_tasks()$$
);
