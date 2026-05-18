#!/usr/bin/env bash
set -euo pipefail
SENTINEL="00000000-0000-4000-8000-000000000001"
BASE_REF="${BASE_REF:-origin/main}"
# Fetch base ref only if we're in a CI shallow clone; ignore failure for local runs.
git fetch --no-tags --depth=1 origin main >/dev/null 2>&1 || true
if git diff "$BASE_REF"...HEAD -- . | grep -F "$SENTINEL" >/dev/null; then
  echo "[check-sentinel] sentinel D1 UUID present in diff against $BASE_REF; replace with the real preview D1 UUID before merging" >&2
  exit 1
fi
echo "[check-sentinel] ok: sentinel D1 UUID not present in diff against $BASE_REF"
