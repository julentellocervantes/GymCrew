#!/usr/bin/env bash
# Instala GymCrew (app + servidor) en una máquina Ubuntu/Debian, con HTTPS automático.
# Uso:  sudo bash server/setup.sh tu-dominio.duckdns.org
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then echo "Falta el dominio. Uso: sudo bash server/setup.sh tu-dominio.duckdns.org"; exit 1; fi
if [ "$(id -u)" -ne 0 ]; then echo "Ejecútalo con sudo."; exit 1; fi

SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP=/opt/gymcrew
DATA=/var/lib/gymcrew

echo "==> 1/6 Paquetes (Node.js 22, Caddy)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https rsync
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> 2/6 Copiando la app a $APP"
id gymcrew >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin gymcrew
mkdir -p "$APP/server" "$DATA"
for f in index.html styles.css app.js i18n.js srv.js config.js sw.js manifest.webmanifest icon.svg; do
  [ -f "$SRC/$f" ] && cp "$SRC/$f" "$APP/$f"
done
cp "$SRC/server/server.js" "$SRC/server/package.json" "$APP/server/"
(cd "$APP/server" && npm install --omit=dev --no-audit --no-fund)
chown -R gymcrew:gymcrew "$APP" "$DATA"

echo "==> 3/6 Servicio del servidor (systemd)"
cat > /etc/systemd/system/gymcrew.service <<UNIT
[Unit]
Description=GymCrew server
After=network.target

[Service]
User=gymcrew
WorkingDirectory=$APP/server
Environment=PORT=8080
Environment=HOST=127.0.0.1
Environment=DATA_FILE=$DATA/db.json
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=$DATA

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now gymcrew
systemctl restart gymcrew

echo "==> 4/6 HTTPS con Caddy para $DOMAIN"
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
	encode gzip
	reverse_proxy 127.0.0.1:8080
}
CADDY
systemctl enable caddy
systemctl restart caddy

echo "==> 5/6 Cortafuegos de la máquina (puertos 80 y 443)"
if command -v iptables >/dev/null; then
  for port in 80 443; do
    iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
  done
  if command -v netfilter-persistent >/dev/null; then netfilter-persistent save >/dev/null 2>&1 || true
  else mkdir -p /etc/iptables && iptables-save > /etc/iptables/rules.v4; fi
fi

echo "==> 6/6 Copia de seguridad diaria de los datos"
cat > /etc/cron.daily/gymcrew-backup <<'BK'
#!/bin/sh
mkdir -p /var/backups/gymcrew
cp /var/lib/gymcrew/db.json "/var/backups/gymcrew/db-$(date +%F).json" 2>/dev/null
find /var/backups/gymcrew -name 'db-*.json' -mtime +14 -delete
BK
chmod +x /etc/cron.daily/gymcrew-backup

sleep 2
echo
if curl -fsS http://127.0.0.1:8080/health; then echo; echo "Servidor en marcha."; else echo "El servidor no responde: mira  journalctl -u gymcrew -n 50"; fi
echo "Abre  https://$DOMAIN  (el certificado tarda unos segundos la primera vez)."
echo "Recuerda abrir los puertos 80 y 443 también en el panel de Oracle (ver DEPLOY.md)."
