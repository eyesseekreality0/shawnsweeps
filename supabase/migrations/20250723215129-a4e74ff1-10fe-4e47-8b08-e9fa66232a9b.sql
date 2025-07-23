-- Add paidly_invoice_id column to deposits table to track Paidly payment invoices
ALTER TABLE public.deposits 
ADD COLUMN paidly_invoice_id TEXT;