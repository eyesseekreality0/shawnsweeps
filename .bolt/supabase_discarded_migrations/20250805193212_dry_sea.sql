/*
  # Stripe Connect Integration

  1. New Tables
    - Update deposits table to support Stripe Connect
    - Add stripe_payment_intent_id column
    - Remove Bitcoin-related columns

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication requirements
*/

-- Add Stripe Connect payment intent ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE public.deposits ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
END $$;

-- Remove Bitcoin-related columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'paidly_interactive_checkout_session_id'
  ) THEN
    ALTER TABLE public.deposits DROP COLUMN paidly_interactive_checkout_session_id;
  END IF;
END $$;

-- Update webhook_logs to support Stripe events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.webhook_logs ALTER COLUMN source SET DEFAULT 'stripe';
  ELSE
    ALTER TABLE public.webhook_logs ADD COLUMN source TEXT DEFAULT 'stripe';
  END IF;
END $$;