#!/bin/bash
# =============================================================
# vps-monitor.sh — Monitor de recursos VPS para itopy
# Envía alertas directamente a Telegram (sin n8n)
# Ejecutar via cron cada 5 minutos:
#   */5 * * * * /opt/scripts/vps-monitor.sh >> /var/log/vps-monitor.log 2>&1
# =============================================================

# --- CONFIGURACIÓN ---
BOT_TOKEN="8728935729:AAHalDSEeo4CZxoPhg6MBan4xdlVpJJtYdg"        # Token del bot de ap_antigravity
CHAT_ID="68673580"            # Tu chat ID personal de Telegram
CPU_THRESHOLD=80      # % de CPU para disparar alerta
RAM_THRESHOLD=85      # % de RAM para disparar alerta
DISK_THRESHOLD=90     # % de disco para disparar alerta
HOSTNAME=$(hostname)

# --- MÉTRICAS ---
# CPU (media del último segundo)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | tr -d '%' | cut -d',' -f1)
CPU_INT=${CPU_USAGE%.*}

# RAM
RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
RAM_USED=$(free -m | awk '/^Mem:/{print $3}')
RAM_PCT=$((RAM_USED * 100 / RAM_TOTAL))

# Disco (partición raíz)
DISK_PCT=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')

# Servicios Docker (detecta contenedores caídos que deberían estar up)
DOCKER_DOWN=$(docker ps --filter "status=exited" --format "{{.Names}}" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

# --- CONSTRUIR ALERTAS ---
ALERTS=()

[ "$CPU_INT" -gt "$CPU_THRESHOLD" ] && \
  ALERTS+=("🔴 CPU al ${CPU_INT}% — umbral: ${CPU_THRESHOLD}%")

[ "$RAM_PCT" -gt "$RAM_THRESHOLD" ] && \
  ALERTS+=("🔴 RAM al ${RAM_PCT}% (${RAM_USED}MB / ${RAM_TOTAL}MB) — umbral: ${RAM_THRESHOLD}%")

[ "$DISK_PCT" -gt "$DISK_THRESHOLD" ] && \
  ALERTS+=("🔴 Disco al ${DISK_PCT}% — umbral: ${DISK_THRESHOLD}%")

[ -n "$DOCKER_DOWN" ] && \
  ALERTS+=("🔴 Contenedores caídos: ${DOCKER_DOWN}")

# --- ENVIAR SI HAY ALERTAS ---
if [ ${#ALERTS[@]} -gt 0 ]; then
  MESSAGE="⚠️ *Alerta VPS — ${HOSTNAME}*\n\n"
  for alert in "${ALERTS[@]}"; do
    MESSAGE+="${alert}\n"
  done
  MESSAGE+="\n🕐 $(date '+%d/%m/%Y %H:%M:%S')"

  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
      \"chat_id\": \"$CHAT_ID\",
      \"text\": \"$MESSAGE\",
      \"parse_mode\": \"Markdown\"
    }"

  echo "[$(date '+%d/%m/%Y %H:%M:%S')] ALERTA enviada — CPU:${CPU_INT}% RAM:${RAM_PCT}% DISK:${DISK_PCT}%"
else
  echo "[$(date '+%d/%m/%Y %H:%M:%S')] OK — CPU:${CPU_INT}% RAM:${RAM_PCT}% DISK:${DISK_PCT}%"
fi
