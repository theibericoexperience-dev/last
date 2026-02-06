
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    do $$
    begin
        alter table public.tours add column if not exists inclusions text[];
        alter table public.tours add column if not exists insurance_options jsonb;
        alter table public.tours add column if not exists extensions_data jsonb;
    end $$;
  `;
  
  // Note: Supabase-js client doesn't support raw SQL query execution directly on the public interface usually,
  // but for the sake of this agent environment we will assume the user runs this SQL in their dashboard
  // OR we rely on the user having done it.
  // HOWEVER, since I have to deliver the result, I will instruct the user or use a tool if available.
  // Wait, I can't execute raw SQL via supabase-js client unless using RPC.
  // I will skip automatic SQL execution and ask user OR just assume columns exist if I create them in the seed.
  // Actually, I'll allow the user to run the SQL or fail if column missing.
  // BETTER: I will create a migration file for the user to see/apply or use in future.
}

console.log("SQL to run in Supabase SQL Editor:");
console.log(`
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS inclusions text[],
ADD COLUMN IF NOT EXISTS insurance_options jsonb,
ADD COLUMN IF NOT EXISTS extensions_data jsonb;
`);
