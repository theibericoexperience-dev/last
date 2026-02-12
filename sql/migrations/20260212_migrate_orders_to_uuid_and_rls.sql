-- START OF SQL (apply in a transaction; backup recommended)
BEGIN;

-- 1) Add new uuid column for id
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS id_new uuid DEFAULT gen_random_uuid();

-- 2) Backfill id_new from existing integer id if you want stable mapping (optional).
-- UPDATE public.orders SET id_new = gen_random_uuid(); -- or custom mapping if required

-- 3) Create unique constraint on id_new and set as PK (deferred swap)
ALTER TABLE public.orders ADD CONSTRAINT orders_id_new_unique UNIQUE (id_new);

-- 4) Create new column user_id_uuid if user_id stored as text but not uuid type
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id_uuid uuid;

-- 5) Add indices
CREATE INDEX IF NOT EXISTS idx_orders_user_id_uuid ON public.orders(user_id_uuid);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id_uuid, status);

-- 6) Update user_id_uuid for existing rows
-- Assumes user_id is a valid UUID string
UPDATE public.orders 
SET user_id_uuid = user_id::uuid 
WHERE user_id IS NOT NULL AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 7) Enable RLS and create policies (adjust names if conflict)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_owner ON public.orders
  FOR SELECT TO authenticated
  USING (user_id_uuid IS NOT NULL AND user_id_uuid = (SELECT auth.uid())::uuid);

CREATE POLICY orders_insert_owner ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id_uuid IS NOT NULL AND user_id_uuid = (SELECT auth.uid())::uuid);

CREATE POLICY orders_update_owner ON public.orders
  FOR UPDATE TO authenticated
  USING (user_id_uuid IS NOT NULL AND user_id_uuid = (SELECT auth.uid())::uuid)
  WITH CHECK (user_id_uuid = (SELECT auth.uid())::uuid);

CREATE POLICY orders_delete_owner ON public.orders
  FOR DELETE TO authenticated
  USING (user_id_uuid IS NOT NULL AND user_id_uuid = (SELECT auth.uid())::uuid);

COMMIT;
-- END OF SQL