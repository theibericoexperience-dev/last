-- Add whatsapp integration columns to user_profiles
ALTER TABLE IF EXISTS public.user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_phone_e164 text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_requested_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.whatsapp_phone_e164 IS 'Normalized E.164 phone number for WhatsApp community';
