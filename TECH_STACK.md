# PartiPrism — Stack technique et instructions de scaffolding

## Stack validée

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Langage** | TypeScript | 5.x |
| **Frontend** | React | 18.3 |
| **Bundler** | Vite | 6.0 |
| **Backend** | Node.js + Express | LTS + 4.x |
| **ORM** | Drizzle ORM | latest |
| **Base de données** | PostgreSQL | 16 |
| **Process manager** | PM2 | latest |
| **Canvas (compas)** | Canvas API natif | — |

---

## Architecture du projet

```
partiprism/
├── packages/
│   ├── client/                    # Frontend React + Vite
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── compass/
│   │       │   │   ├── CompassCanvas.tsx      # Rendu Canvas du compas 2D
│   │       │   │   ├── FractureAnimation.tsx   # Animation de fracture
│   │       │   │   ├── PartyDot.tsx            # Point parti politique
│   │       │   │   ├── UserDot.tsx             # Point utilisateur
│   │       │   │   └── Nebula.tsx              # Nébuleuse collective
│   │       │   ├── onboarding/
│   │       │   │   ├── OnboardingFlow.tsx      # Orchestration du parcours 7 min
│   │       │   │   ├── QuestionCard.tsx        # Affichage d'une question
│   │       │   │   ├── AnswerButtons.tsx       # Boutons de réponse (5 choix)
│   │       │   │   ├── Axis1D.tsx              # Barre gauche-droite (phase 1)
│   │       │   │   └── ResultScreen.tsx        # Écran de résultat + partage
│   │       │   ├── decryptage/
│   │       │   │   └── (v2)
│   │       │   ├── expression/
│   │       │   │   └── (v2)
│   │       │   └── synthese/
│   │       │       └── (v2)
│   │       ├── hooks/
│   │       │   ├── useCompassPosition.ts       # Calcul de position depuis réponses
│   │       │   ├── useAnimation.ts             # Hook pour requestAnimationFrame
│   │       │   └── useSession.ts               # Gestion session anonyme
│   │       ├── stores/
│   │       │   └── onboardingStore.ts          # État du parcours (zustand ou contexte)
│   │       ├── types/
│   │       │   └── index.ts                    # Types partagés
│   │       ├── utils/
│   │       │   ├── scoring.ts                  # Algorithme de calcul de position
│   │       │   └── sharing.ts                  # Génération image de partage
│   │       ├── data/
│   │       │   ├── parties.ts                  # Données partis (depuis parties.yaml)
│   │       │   └── questions.ts                # Questions onboarding (depuis questions.md)
│   │       └── styles/
│   │           └── index.css
│   │
│   ├── server/                    # Backend Express + Drizzle
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts                        # Point d'entrée Express
│   │       ├── routes/
│   │       │   ├── opinions.ts                 # POST /api/opinions — enregistrer un avis
│   │       │   ├── synthesis.ts                # GET /api/synthesis/:subjectId — synthèse collective
│   │       │   ├── subjects.ts                 # GET /api/subjects — sujets d'actualité
│   │       │   └── share.ts                    # GET /api/share/:id — image de partage (Open Graph)
│   │       ├── db/
│   │       │   ├── schema.ts                   # Schéma Drizzle
│   │       │   ├── migrate.ts                  # Script de migration
│   │       │   └── seed.ts                     # Données initiales (partis, domaines, questions)
│   │       ├── services/
│   │       │   ├── scoring.ts                  # Calcul de position (même logique que client)
│   │       │   └── synthesis.ts                # Agrégation des avis + stats
│   │       └── middleware/
│   │           ├── fingerprint.ts              # Anti-manipulation (device fingerprint)
│   │           └── rateLimit.ts                # Rate limiting
│   │
│   └── shared/                    # Types et constantes partagés client/serveur
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types.ts                        # Position, Question, Opinion, Party, etc.
│           └── constants.ts                    # Domaines, quadrants, configs
│
├── docs/                          # Documentation (déjà créée)
│   ├── DATA_MODEL.md
│   ├── COMPASS_SPEC.md
│   └── STRUCTURE.md
│
├── data/                          # Données de référence (déjà créées)
│   ├── domains.yaml
│   ├── parties.yaml
│   └── questions.md
│
├── ecosystem.config.js            # Config PM2
├── package.json                   # Workspace root
├── tsconfig.base.json             # Config TS partagée
├── README.md
└── .gitignore
```

---

## Schéma Drizzle (PostgreSQL)

```typescript
// packages/server/src/db/schema.ts

import { pgTable, uuid, text, real, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

// Domaines thématiques (10 entrées, seed)
export const domains = pgTable('domains', {
  id: text('id').primaryKey(),                    // "travail", "sante", etc.
  label: text('label').notNull(),                  // "Travail et emploi"
  order: integer('order').notNull(),
  description: text('description'),
  dimensionSocietale: jsonb('dimension_societale'), // { tension, exemples_progressiste, exemples_conservateur }
  dimensionEconomique: jsonb('dimension_economique'),
});

// Thèmes permanents (~50 entrées, seed)
export const themes = pgTable('themes', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  label: text('label').notNull(),
  description: text('description'),
});

// Questions de positionnement (50 entrées, seed)
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),                     // "onb-01", "deep-travail-01"
  text: text('text').notNull(),
  type: text('type').notNull(),                    // "affirmation" | "dilemme"
  axis: text('axis').notNull(),                    // "societal" | "economic" | "both"
  polarity: real('polarity').notNull(),            // -1 ou +1
  domainId: text('domain_id').references(() => domains.id).notNull(),
  phase: text('phase').notNull(),                  // "onboarding" | "deep"
  weight: real('weight').notNull().default(1.0),
  options: jsonb('options'),                       // Pour les dilemmes : ["Option A", ..., "Option E"]
});

// Partis politiques (9 entrées, seed)
export const parties = pgTable('parties', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  abbreviation: text('abbreviation').notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  color: text('color').notNull(),
  leader: text('leader'),
  visibleOnCompass: boolean('visible_on_compass').notNull().default(true),
});

// Médias (à remplir, même structure)
export const medias = pgTable('medias', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  type: text('type').notNull(),                    // "tv" | "radio" | "presse" | "web"
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  owner: text('owner'),
  visibleOnCompass: boolean('visible_on_compass').notNull().default(true),
});

// Sessions anonymes
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  positionSocietal: real('position_societal'),
  positionEconomic: real('position_economic'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  deviceFingerprint: text('device_fingerprint'),
  shareCount: integer('share_count').notNull().default(0),
});

// Réponses aux questions
export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  questionId: text('question_id').references(() => questions.id).notNull(),
  value: real('value').notNull(),                  // -2, -1, 0, +1, +2
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sujets d'actualité
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  label: text('label').notNull(),
  summary: text('summary'),
  datePublished: timestamp('date_published').notNull().defaultNow(),
  dateExpires: timestamp('date_expires'),
  isActive: boolean('is_active').notNull().default(true),
  decryptage: jsonb('decryptage'),                 // { qui_dit_quoi, biais_mediatiques, enjeux_caches }
});

// Avis citoyens sur les sujets d'actualité
export const opinions = pgTable('opinions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  subjectId: text('subject_id').references(() => subjects.id).notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## Config PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'partiprism-api',
      script: 'packages/server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/partiprisms',
      },
    },
  ],
};
```

---

## Config Vite

```typescript
// packages/client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

---

## Instructions pour Claude Code

### Étape 1 : Scaffolding

```bash
# Initialiser le workspace
mkdir partiprism && cd partiprism
npm init -y

# Créer la structure monorepo
mkdir -p packages/client packages/server packages/shared

# Installer les dépendances client
cd packages/client
npm create vite@latest . -- --template react-ts
npm install zustand
npm install -D tailwindcss @tailwindcss/vite

# Installer les dépendances serveur
cd ../server
npm init -y
npm install express cors drizzle-orm postgres dotenv
npm install -D typescript @types/express @types/cors @types/node tsx drizzle-kit

# Installer les dépendances shared
cd ../shared
npm init -y
npm install -D typescript

# Retour à la racine
cd ../..
npm install -D pm2
```

### Étape 2 : Implémenter dans cet ordre

1. **shared/types.ts** — Définir les types Position, Question, Party, Opinion
2. **client/data/** — Convertir parties.yaml et questions.md en fichiers TypeScript
3. **client/utils/scoring.ts** — Algorithme de calcul de position
4. **client/components/compass/CompassCanvas.tsx** — Rendu du compas 2D
5. **client/components/compass/FractureAnimation.tsx** — Animation de fracture (voir COMPASS_SPEC.md)
6. **client/components/onboarding/OnboardingFlow.tsx** — Orchestration des 3 phases
7. **server/db/schema.ts** — Schéma Drizzle (copier depuis ce document)
8. **server/db/seed.ts** — Importer les données de référence
9. **server/routes/** — API endpoints
10. **Intégration** — Connecter client et serveur

### Étape 3 : Tester

- Vérifier que les 10 questions d'onboarding positionnent correctement sur les 2 axes
- Vérifier que l'animation de fracture est fluide (60fps)
- Vérifier le responsive (mobile 320px → desktop 1200px)
- Vérifier le dark mode
- Vérifier que les avis s'enregistrent en base

---

## Variables d'environnement

```env
# packages/server/.env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://partiprism:partiprism@localhost:5432/partiprisms

# packages/client/.env
VITE_API_URL=http://localhost:3001
```

---

## Fichiers liés

- `README.md` — Vision et architecture globale
- `docs/DATA_MODEL.md` — Modèle de données conceptuel
- `docs/COMPASS_SPEC.md` — Spécification détaillée du compas et de l'animation
- `data/domains.yaml` — 10 domaines thématiques
- `data/parties.yaml` — 9 partis politiques positionnés
- `data/questions.md` — 50 questions de positionnement
