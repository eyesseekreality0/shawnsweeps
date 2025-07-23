-- Enable Row Level Security on webhook_logs table
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for webhook_logs - only allow system/admin access
-- Since webhooks are system-level events, we'll restrict access
CREATE POLICY "System can access webhook logs" 
ON public.webhook_logs 
FOR ALL 
USING (false); -- This effectively restricts all access through RLS

-- Alternatively, you could allow authenticated users to view logs related to their deposits:
-- CREATE POLICY "Users can view webhook logs for their deposits" 
-- ON public.webhook_logs 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.deposits 
--     WHERE deposits.id = webhook_logs.deposit_id 
--     AND deposits.user_id = auth.uid()
--   )
-- );