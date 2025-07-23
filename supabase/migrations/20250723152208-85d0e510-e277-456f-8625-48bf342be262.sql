-- Remove user_id requirement from deposits table since we no longer need authentication
ALTER TABLE public.deposits ALTER COLUMN user_id DROP NOT NULL;

-- Drop the RLS policies since we no longer need user authentication
DROP POLICY IF EXISTS "Users can view their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can update their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can delete their own deposits" ON public.deposits;

-- Disable RLS since we don't need user authentication anymore
ALTER TABLE public.deposits DISABLE ROW LEVEL SECURITY;

-- Create a simple policy to allow all operations since it's now a public form
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on deposits" 
ON public.deposits 
FOR ALL 
USING (true) 
WITH CHECK (true);