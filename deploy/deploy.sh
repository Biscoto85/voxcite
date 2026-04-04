#!/bin/bash
# PartiPrism — Script de déploiement
# Usage: bash deploy/deploy.sh
#
# Ce script :
# 1. Pull les dernières modifications depuis GitHub
# 2. Installe les dépendances
# 3. Build le projet (shared → client + server)
# 4. Exécute les migrations DB
# 5. Redémarre le serveur (PM2 ou systemd)

set -euo pipefail

APP_DIR="/var/www/partiprism"
BRANCH="${1:-main}"

echo "=== PartiPrism — Déploiement ==="
echo "Branche : $BRANCH"
echo "Répertoire : $APP_DIR"
echo ""

cd "$APP_DIR"

# 1. Pull
echo "[1/5] Git pull..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. Install
echo "[2/5] Installation des dépendances..."
pnpm install --frozen-lockfile

# 3. Build
echo "[3/5] Build production..."
pnpm run build

# 4. Migrations
echo "[4/5] Migrations DB..."
pnpm run db:migrate

# 5. Restart
echo "[5/5] Redémarrage du serveur..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.js --update-env
    echo "[ok] PM2 redémarré."
elif systemctl is-active --quiet partiprism; then
    sudo systemctl restart partiprism
    echo "[ok] systemd redémarré."
else
    echo "[warn] Ni PM2 ni systemd détecté. Démarrage manuel :"
    echo "  cd $APP_DIR && pm2 start ecosystem.config.js"
fi

echo ""
echo "=== Déploiement terminé ==="
echo "Site : https://partiprism.fr"
