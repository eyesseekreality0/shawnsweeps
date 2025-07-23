-- Fix function search path security issue
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';