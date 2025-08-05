-- Update deposits table to use Speed instead of Paidly
ALTER TABLE public.deposits DROP COLUMN IF EXISTS paidly_invoice_id;
ALTER TABLE public.deposits ADD COLUMN speed_checkout_session_id TEXT;

-- Update webhook_logs to track Speed events
ALTER TABLE public.webhook_logs ADD COLUMN source TEXT DEFAULT 'speed';