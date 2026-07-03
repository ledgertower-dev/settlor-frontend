#!/bin/sh
set -e

# Generate runtime environment variables for the browser.
# This file is loaded via <Script> in layout.tsx before React hydrates,
# making runtime env vars available on window.__ENV.

# Escape backslashes and double quotes to prevent JS injection via env vars.
sanitize() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Validate that a value looks like a URL (scheme://host).
validate_url() {
  case "$1" in
    http://*|https://*|ws://*|wss://*) return 0 ;;
    *) echo "ERROR: Invalid URL for $2: $1" >&2; return 1 ;;
  esac
}

RAW_API_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3001}"
RAW_WS_URL="${NEXT_PUBLIC_WS_URL:-ws://localhost:3001}"

validate_url "$RAW_API_URL" "NEXT_PUBLIC_API_BASE_URL"
validate_url "$RAW_WS_URL" "NEXT_PUBLIC_WS_URL"

API_URL=$(sanitize "$RAW_API_URL")
WS_URL=$(sanitize "$RAW_WS_URL")

cat <<EOF > /app/public/__env.js
window.__ENV = {
  NEXT_PUBLIC_API_BASE_URL: "${API_URL}",
  NEXT_PUBLIC_WS_URL: "${WS_URL}"
};
EOF

echo "Generated /app/public/__env.js"
echo "  NEXT_PUBLIC_API_BASE_URL=${API_URL}"
echo "  NEXT_PUBLIC_WS_URL=${WS_URL}"

exec node server.js
