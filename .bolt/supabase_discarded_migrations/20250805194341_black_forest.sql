/*
  # Vert Payment Integration

  1. Changes
    - Add vert_payment_id column to deposits table
    - Remove stripe_payment_intent_id column if it exists
    - Update webhook_logs to support Vert events

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication requirements
*/

-- Add Vert payment ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'vert_payment_id'
  ) THEN
    ALTER TABLE public.deposits ADD COLUMN vert_payment_id TEXT;
  END IF;
END $$;

-- Remove Stripe payment intent ID column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE public.deposits DROP COLUMN stripe_payment_intent_id;
  END IF;
END $$;

-- Update webhook_logs to support Vert events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.webhook_logs ALTER COLUMN source SET DEFAULT 'vert';
  ELSE
    ALTER TABLE public.webhook_logs ADD COLUMN source TEXT DEFAULT 'vert';
  END IF;
END $$;