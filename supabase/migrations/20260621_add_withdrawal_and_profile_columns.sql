-- Migration: Add email verification, task progress, identity flags and withdrawal countdown fields

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS withdrawal_email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS valid_email_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS task_progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS task_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false;

-- Add withdrawal countdown fields
ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS countdown_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS countdown_ends_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS countdown_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_requirements';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_task_progress ON profiles(task_progress);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
