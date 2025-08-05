/*
  # Update deposits table for Paidly Interactive integration

  1. Changes
    - Add paidly_interactive_checkout_session_id column to deposits table
    - Remove paidly_checkout_session_id column if it exists
    - Update webhook_logs to support Paidly Interactive events

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication requirements
*/

-- Add Paidly Interactive checkout session ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'paidly_interactive_checkout_session_id'
  ) THEN
    ALTER TABLE public.deposits ADD COLUMN paidly_interactive_checkout_session_id TEXT;
  END IF;
END $$;

-- Remove old Paidly checkout session ID column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'paidly_checkout_session_id'
  ) THEN
    ALTER TABLE public.deposits DROP COLUMN paidly_checkout_session_id;
  END IF;
END $$;

-- Ensure webhook_logs table exists and has source column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_logs') THEN
    CREATE TABLE public.webhook_logs (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      source TEXT DEFAULT 'paidly_interactive',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Allow all operations on webhook_logs" 
    ON public.webhook_logs 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
  
  -- Update source column default for Paidly Interactive
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.webhook_logs ALTER COLUMN source SET DEFAULT 'paidly_interactive';
  ELSE
    ALTER TABLE public.webhook_logs ADD COLUMN source TEXT DEFAULT 'paidly_interactive';
  END IF;
END $$;