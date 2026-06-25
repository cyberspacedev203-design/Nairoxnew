-- Add welcome_sent flag to profiles to avoid duplicate welcome emails
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS welcome_sent boolean DEFAULT false;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_sent ON public.profiles(welcome_sent);
