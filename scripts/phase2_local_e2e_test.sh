#!/usr/bin/env bash
# Simple local e2e test harness that sets FAKE_AUTH_USER_ID and calls profile endpoints
# Usage: ./scripts/phase2_local_e2e_test.sh http://localhost:3000

set -euo pipefail
BASE=${1:-http://localhost:3000}
FAKE_ID=${FAKE_AUTH_USER_ID:-00000000-0000-0000-0000-000000000000}

export FAKE_AUTH_USER_ID=$FAKE_ID

echo "Using FAKE_AUTH_USER_ID=$FAKE_AUTH_USER_ID"

# 1) GET profile
echo "\nGET /api/user/profile"
curl -s -H "Content-Type: application/json" -H "Cookie: sb-access-token=FAKE" "$BASE/api/user/profile" | jq || true

# 2) PATCH /api/user/profile (attempt upsert)
PAYLOAD='{"name":"Local Test","email":"local+test@example.com"}'
echo "\nPATCH /api/user/profile -> payload: $PAYLOAD"
curl -s -X PATCH -H "Content-Type: application/json" -H "Cookie: sb-access-token=FAKE" -d "$PAYLOAD" "$BASE/api/user/profile" | jq || true

# 3) Quick create to verify upsert helper works when called directly (test endpoint for orders not present here)

echo "\nLocal e2e test done. If responses contain user id and profile info, mock worked." 
