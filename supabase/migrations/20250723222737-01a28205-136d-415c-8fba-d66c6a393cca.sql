-- Enable realtime for deposits and webhook_logs tables
ALTER TABLE public.deposits REPLICA IDENTITY FULL;
ALTER TABLE public.webhook_logs REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;