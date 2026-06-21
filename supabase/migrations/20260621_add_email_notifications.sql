-- Migration: add email verification token columns and email_notifications table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verification_token text,
  ADD COLUMN IF NOT EXISTS email_token_expires_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  sent boolean DEFAULT false,
  sent_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_sent ON email_notifications(sent);
