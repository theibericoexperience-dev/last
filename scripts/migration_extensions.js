
console.log("SQL to run in Supabase SQL Editor:");
console.log(`
-- 1. Añadir columnas para precios e información comercial
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS inclusions text[],
ADD COLUMN IF NOT EXISTS insurance_options jsonb,
ADD COLUMN IF NOT EXISTS related_tours jsonb; 
-- related_tours guardará referencias: [{"id": "ext-bcn", "title": "Barcelona", "price": 1200, "when": "PRE"}]

-- 2. Asegurarnos de que el precio existe (si no lo tenías antes)
-- "Tour Cost" ya existe en tu esquema inicial, así que perfecto.
`);
