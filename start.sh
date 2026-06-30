#!/bin/sh
# Pornește serverul bgutil POT provider în background (port 4416 default).
# Acesta generează PO Tokens pentru yt-dlp, necesare ca YouTube să servească
# rezoluții înalte (1080p+) către IP-uri de datacenter precum Railway.

if [ -f /opt/bgutil-server/server/build/main.js ]; then
  echo "[bgutil] Starting POT provider server on port 4416..."
  cd /opt/bgutil-server/server
  node build/main.js > /tmp/bgutil.log 2>&1 &
  BGUTIL_PID=$!
  cd /app

  # Așteptăm până la 10 secunde ca serverul să răspundă, verificând activ
  # în loc să presupunem că a pornit corect doar pentru că procesul a fost lansat.
  i=0
  STARTED=0
  while [ $i -lt 10 ]; do
    if ! kill -0 "$BGUTIL_PID" 2>/dev/null; then
      echo "[bgutil] Process died early (PID $BGUTIL_PID). Log output:"
      cat /tmp/bgutil.log
      break
    fi
    if curl -fsS http://127.0.0.1:4416/ping >/dev/null 2>&1 || curl -fsS http://127.0.0.1:4416/ >/dev/null 2>&1; then
      STARTED=1
      break
    fi
    sleep 1
    i=$((i + 1))
  done

  if [ "$STARTED" = "1" ]; then
    echo "[bgutil] Server confirmed responding on :4416 (PID $BGUTIL_PID)"
  else
    echo "[bgutil] WARNING: server did not confirm responding after 10s. Log output so far:"
    cat /tmp/bgutil.log 2>/dev/null
    echo "[bgutil] Continuing anyway -- yt-dlp will fall back to lower quality without PO Token."
  fi
else
  echo "[bgutil] Server build not found at /opt/bgutil-server/server/build/main.js -- skipping (yt-dlp will fall back to lower quality)"
fi

exec next start