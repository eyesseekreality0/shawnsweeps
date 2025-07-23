-- Add paid_at column to deposits table for tracking payment completion time
ALTER TABLE public.deposits 
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

-- Create webhook_logs table to track webhook events from payment providers
CREATE TABLE public.webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL, -- 'paidly', 'stripe', etc.
    event_type TEXT NOT NULL, -- webhook event type
    invoice_id TEXT, -- external invoice/payment ID
    deposit_id UUID REFERENCES public.deposits(id), -- link to our deposit
    payload JSONB NOT NULL, -- full webhook payload
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT, -- resulting status after processing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster webhook log queries
CREATE INDEX idx_webhook_logs_provider_event ON public.webhook_logs(provider, event_type);
CREATE INDEX idx_webhook_logs_deposit_id ON public.webhook_logs(deposit_id);
CREATE INDEX idx_webhook_logs_invoice_id ON public.webhook_logs(invoice_id);