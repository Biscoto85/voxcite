# PartiPrism — Données de référence (contenu éditorial)

Ce dossier contient **tout le contenu politique et éditorial** du projet,
séparé du code applicatif (`packages/`).

Les fichiers ici sont au format YAML/Markdown pour être facilement éditables
par des non-développeurs (journalistes, politologues, contributeurs).

## Structure

```
data/
├── domains/              # Les 10 domaines thématiques
│   └── domains.yaml      # Domaines + thèmes permanents + axes de lecture
│
├── parties/              # Partis politiques
│   └── parties.yaml      # Positionnement des partis sur le compas 2D
│
├── questions/            # Questions de positionnement
│   └── questions.md      # 50 questions (10 onboarding + 40 approfondissement)
│
├── medias/               # Médias (à venir)
│   └── (medias.yaml)     # Positionnement des médias sur le compas 2D
│
└── README.md             # Ce fichier
```

## Principes

- **Lisibilité** : YAML et Markdown, pas de JSON ni de TypeScript ici
- **Séparation** : le code ne contient aucune donnée politique en dur
- **Traçabilité** : chaque modification est versionnée dans git
- **Collaboration** : un contributeur non-technique peut modifier ces fichiers

## Comment ça fonctionne

Le script `npm run db:seed` (côté serveur) lit ces fichiers et les injecte
en base de données PostgreSQL. Le client charge les données via l'API.
