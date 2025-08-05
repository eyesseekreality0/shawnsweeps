/*
  # Add Wert.io order ID to deposits table

  1. Changes
    - Add `wert_order_id` column to `deposits` table for tracking Wert.io payments
    - Remove old `vert_payment_id` column if it exists
    - Update indexes and constraints as needed

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication or permissions
*/

-- Add wert_order_id column to deposits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'wert_order_id'
  ) THEN
    ALTER TABLE deposits ADD COLUMN wert_order_id text;
  END IF;
END $$;

-- Remove old vert_payment_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'vert_payment_id'
  ) THEN
    ALTER TABLE deposits DROP COLUMN vert_payment_id;
  END IF;
END $$;