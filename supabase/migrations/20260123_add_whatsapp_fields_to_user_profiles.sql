-- Migration: add whatsapp fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone_e164 VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_requested_at TIMESTAMPTZ;

-- Note: This migration is intentionally added to the repo and should be applied
-- via your deployment/CI process. Do not run manually in this environment.
