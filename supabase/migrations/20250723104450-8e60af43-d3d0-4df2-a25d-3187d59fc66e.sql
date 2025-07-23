-- Add game_name column to deposits table
ALTER TABLE public.deposits 
ADD COLUMN game_name TEXT;