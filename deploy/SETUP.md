# PartiPrism — Guide d'installation VPS

## Prérequis

- Ubuntu 22.04+ / Debian 12+
- Node.js 22+ (`nvm install 22`)
- pnpm (`npm i -g pnpm`)
- PostgreSQL 15+
- Nginx
- Certbot (pour SSL)
- PM2 (`npm i -g pm2`) ou systemd

## 1. Cloner le repo

```bash
cd /var/www
git clone https://github.com/biscoto85/voxcite.git partiprism
cd partiprism
```

## 2. Configurer PostgreSQL

```bash
sudo -u postgres bash deploy/setup-db.sh
```

Cela crée le user `partiprism` et la base `partiprisms`.

## 3. Configurer l'environnement

```bash
cp deploy/.env.production .env
nano .env  # Remplir DATABASE_URL et ANTHROPIC_API_KEY
```

## 4. Installer et build

```bash
pnpm install
pnpm run build
```

## 5. Migrations et seed

```bash
pnpm run db:migrate
pnpm run db:seed
```

## 6. Démarrer le serveur

### Option A : PM2 (recommandé)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Pour démarrer au boot
```

### Option B : systemd

```bash
sudo cp deploy/partiprism.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now partiprism
```

## 7. Configurer Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/partiprism.fr
sudo ln -s /etc/nginx/sites-available/partiprism.fr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL avec Certbot

```bash
sudo certbot --nginx -d partiprism.fr -d www.partiprism.fr
```

## 9. Vérifier

```bash
curl https://partiprism.fr/api/health
# → {"status":"ok","timestamp":"..."}
```

## Mise à jour

```bash
cd /var/www/partiprism
bash deploy/deploy.sh main
```

## Batch quotidien (programme citoyen)

Ajouter au crontab :

```bash
crontab -e
# Ajouter :
0 3 * * * cd /var/www/partiprism && /usr/bin/node packages/server/dist/batch/generate-program.js >> /var/log/partiprism-batch.log 2>&1
```

## Ports utilisés

| Service | Port | Accès |
|---------|------|-------|
| Nginx | 80/443 | Public (HTTP/HTTPS) |
| PartiPrism API | 3001 | Local uniquement (via Nginx proxy) |
| PostgreSQL | 5432 | Local uniquement |

Le port 3001 n'est PAS exposé publiquement — Nginx fait le reverse proxy.
