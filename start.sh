#!/bin/sh
# Pornește serverul bgutil POT provider în background (port 4416 default).
# Acesta generează PO Tokens pentru yt-dlp, necesare ca YouTube să servească
# rezoluții înalte (1080p+) către IP-uri de datacenter precum Railway.
# Dacă serverul lipsește (build anterior fără pasul install-ytdlp), pornim
# oricum Next.js — download-ul va face fallback automat la calitate mai mică.

if [ -f /opt/bgutil-server/server/build/main.js ]; then
  echo "[bgutil] Starting POT provider server on port 4416..."
  node /opt/bgutil-server/server/build/main.js > /tmp/bgutil.log 2>&1 &
  BGUTIL_PID=$!
  echo "[bgutil] Started with PID $BGUTIL_PID"
else
  echo "[bgutil] Server not found at /opt/bgutil-server — skipping (yt-dlp will fall back to lower quality)"
fi

exec next start