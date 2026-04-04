#!/bin/bash
# PartiPrism — Setup PostgreSQL (user + DB)
# Usage: sudo -u postgres bash deploy/setup-db.sh
#
# Ce script crée :
# - Un user PostgreSQL "partiprism" (mot de passe à définir)
# - Une base "partiprisms" appartenant à ce user

set -euo pipefail

DB_USER="partiprism"
DB_NAME="partiprisms"

echo "=== PartiPrism — PostgreSQL Setup ==="

# Demander le mot de passe
read -sp "Mot de passe pour le user PostgreSQL '$DB_USER': " DB_PASS
echo

# Créer le user (si pas déjà existant)
if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo "[info] User '$DB_USER' existe déjà."
else
    psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    echo "[ok] User '$DB_USER' créé."
fi

# Créer la base (si pas déjà existante)
if psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "[info] Base '$DB_NAME' existe déjà."
else
    psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo "[ok] Base '$DB_NAME' créée."
fi

# Accorder les droits
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo ""
echo "=== Setup terminé ==="
echo ""
echo "DATABASE_URL à mettre dans .env :"
echo "  DATABASE_URL=postgresql://$DB_USER:VOTRE_MDP@localhost:5432/$DB_NAME"
echo ""
echo "Ensuite, lancer les migrations :"
echo "  cd /var/www/partiprism && npm run db:migrate && npm run db:seed"
