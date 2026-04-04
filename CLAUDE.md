# CLAUDE.md — Instructions pour Claude Code

## Projet

PartiPrism est une application citoyenne qui remplace l'axe politique gauche-droite
par un compas à 2 axes (sociétal + économique). TypeScript monorepo.

Domaine : partiprism.fr | Repo GitHub : biscoto85/voxcite

## Architecture

```
packages/client/   → Frontend React + Vite + Tailwind (port 5173)
packages/server/   → Backend Express + Drizzle ORM + PostgreSQL (port 3001)
packages/shared/   → Types et constantes partagés
data/              → Contenu éditorial (questions, partis, domaines) — PAS du code
docs/              → Documentation (specs, modèle de données)
deploy/            → Config déploiement (nginx, systemd, scripts)
```

## Séparation code / contenu

- Le dossier `data/` contient TOUT le contenu politique (YAML/Markdown)
- Le code (`packages/`) ne doit JAMAIS contenir de données politiques en dur
- Le seed (`packages/server/src/db/seed.ts`) importe data/ vers PostgreSQL

## Commandes

```bash
npm run dev          # Lance client + server en parallèle
npm run dev:client   # Frontend seul (Vite, port 5173)
npm run dev:server   # Backend seul (Express, port 3001)
npm run build        # Build production
npm run db:generate  # Générer les migrations Drizzle
npm run db:migrate   # Appliquer les migrations
npm run db:seed      # Injecter les données de data/ en base
```

## Branches

- `main` — production stable
- `dev` — développement courant
- `claude/*` — branches de travail Claude Code

## Conventions

- TypeScript strict partout
- Imports avec alias `@/` côté client
- Types partagés via `@partiprism/shared`
- API préfixée `/api`

## Déploiement (VPS)

- Chemin : `/var/www/partiprism`
- User PostgreSQL : `partiprism` / DB : `partiprisms`
- Nginx reverse proxy → PM2 cluster sur port 3001
- Domaine : partiprism.fr
