-- Add departure_airports column to tours table
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS departure_airports text[];

-- Optional: Add comment
COMMENT ON COLUMN public.tours.departure_airports IS 'List of departure airports for the tour modal';
