#!/usr/bin/env bash
set -euo pipefail

# Usage: VERCEL_TOKEN must be set in environment
# Optionally set PROJECT_NAME (defaults to agencia-viajes2)
# Example:
#   export VERCEL_TOKEN=...; PROJECT_NAME=agencia-viajes2 ./scripts/vercel_manage_envs.sh

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN env var before running this script}" 
PROJECT_NAME="${PROJECT_NAME:-agencia-viajes2}"
TARGET="production"

command -v jq >/dev/null 2>&1 || { echo "jq is required. Install it and retry."; exit 1; }

echo "Finding project id for '$PROJECT_NAME'..."
PROJECT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects" | jq -r --arg NAME "$PROJECT_NAME" '.projects[] | select(.name==$NAME) | .id')

if [ -z "$PROJECT_ID" ]; then
  echo "Error: project '$PROJECT_NAME' not found in your Vercel account.
If the project is under a team, set TEAM_ID environment variable and re-run." >&2
  exit 1
fi

echo "Project ID: $PROJECT_ID"

echo "Fetching existing env vars..."
EXISTING_JSON=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$PROJECT_ID/env")

get_env_id() {
  local key="$1"
  echo "$EXISTING_JSON" | jq -r --arg K "$key" '.envs[] | select(.key==$K) | .id' | head -n1 || true
}

# Desired env vars to ensure
declare -A envs
envs[NEXTAUTH_URL]="https://ibero.world"
envs[AUTH_URL]="https://ibero.world"
envs[AUTH_TRUST_HOST]="true"

for key in "${!envs[@]}"; do
  value="${envs[$key]}"
  echo "Processing $key -> $value"
  env_id=$(get_env_id "$key")
  if [ -n "$env_id" ]; then
    echo "- Updating existing $key (id: $env_id) for production"
    curl -s -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$env_id" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"value\":\"$value\",\"target\":[\"$TARGET\"]}" | jq -c '.'
  else
    echo "- Creating $key for production"
    curl -s -X POST "https://api.vercel.com/v9/projects/$PROJECT_ID/env" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[\"$TARGET\"],\"type\":\"plain\"}" | jq -c '.'
  fi
done

# Remove AUTH_REDIRECT_PROXY_URL if present
proxy_id=$(get_env_id "AUTH_REDIRECT_PROXY_URL")
if [ -n "$proxy_id" ]; then
  echo "Found AUTH_REDIRECT_PROXY_URL (id: $proxy_id). Deleting it to avoid redirect proxy usage."
  curl -s -X DELETE "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$proxy_id" -H "Authorization: Bearer $VERCEL_TOKEN" | jq -c '.'
else
  echo "No AUTH_REDIRECT_PROXY_URL found."
fi

echo "Done. Please verify in Vercel Dashboard and in Google Cloud Console that https://ibero.world/api/auth/callback/google is registered as an authorized redirect URI."