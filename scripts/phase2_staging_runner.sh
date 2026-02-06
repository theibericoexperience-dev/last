#!/usr/bin/env bash
# Runner para Phase2: ejecuta scripts de mapping, valida y para si hay problemas.
# Requiere: psql en PATH, variable DATABASE_URL o parámetros claros.
# Uso: FAKE=false ./scripts/phase2_staging_runner.sh postgres://user:pass@host:5432/db

set -euo pipefail
DB_URL=${1:-${DATABASE_URL:-}}
if [ -z "$DB_URL" ]; then
  echo "Usage: $0 <postgres://user:pass@host:5432/db>" >&2
  exit 2
fi

SCRIPTS=(
  "migrations/phase2_update_fks_orders.sql"
  "migrations/phase2_update_fks_support_tickets.sql"
  "migrations/phase2_update_fks_ticket_replies.sql"
  "migrations/phase2_update_fks_user_bonuses.sql"
  "migrations/phase2_update_fks_scheduled_calls.sql"
)

for script in "${SCRIPTS[@]}"; do
  echo "\n--- Running $script ---"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$script"

  table=$(basename "$script" .sql | sed 's/phase2_update_fks_//')
  echo "Validating table: $table"
  # Count rows where original user_id is present but user_id_new is NULL
  count=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM public.${table} WHERE user_id IS NOT NULL AND user_id_new IS NULL;")
  echo "Missing user_id_new rows: $count"
  if [ "$count" -gt 0 ]; then
    echo "Found $count problematic rows in $table. Dumping sample and aborting." >&2
    psql "$DB_URL" -c "SELECT * FROM public.${table} WHERE user_id IS NOT NULL AND user_id_new IS NULL LIMIT 50;"
    exit 3
  fi

  # Check collisions table
  collisions=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM admin.user_profiles_email_collisions;") || collisions=0
  echo "Collisions recorded: $collisions"

  # Validate FK exists
  fk_name="fk_${table}_user_new"
  fk_exists=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = '${fk_name}';")
  echo "FK ${fk_name} exists? $fk_exists"
  if [ "$fk_exists" -eq 0 ]; then
    echo "Warning: FK ${fk_name} not present for table ${table}." >&2
  fi

done

echo "All scripts executed and validated. Next: schedule maintenance window to swap columns per playbook." 
