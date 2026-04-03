# VoxCité — Structure du projet

```
voxcite/
│
├── README.md                     # Vision, principes, architecture
│
├── docs/
│   ├── DATA_MODEL.md             # Modèle de données complet
│   ├── PARCOURS.md               # Détail du parcours "révélation" 7 min (à créer)
│   ├── UX_DESIGN.md              # Principes UX et maquettes (à créer)
│   └── EDITORIAL.md              # Méthodologie de positionnement partis/médias (à créer)
│
├── data/
│   ├── domains.yaml              # 10 domaines + thèmes permanents + axes
│   ├── parties.yaml              # Partis politiques positionnés sur le compas
│   ├── medias.yaml               # Médias positionnés sur le compas (à créer)
│   └── questions/                # Questions de positionnement par domaine (à créer)
│       ├── travail.yaml
│       ├── sante.yaml
│       └── ...
│
├── src/                          # Code source (stack à définir)
│   ├── frontend/                 # Web app + mobile
│   ├── backend/                  # API + IA
│   └── shared/                   # Types, constantes, utilitaires partagés
│
└── assets/                       # Visuels, logo, images de partage
    ├── logo/
    └── share-templates/          # Templates d'images partageables
```

## Prochaines étapes

1. **Choix de la stack technique** — Framework frontend (React/Next.js ? Flutter ?), backend, base de données
2. **Rédaction des questions de positionnement** — ~10 questions par domaine pour l'onboarding
3. **Positionnement des médias** — Même format que les partis
4. **Maquette du compas 2D** — Prototype interactif de la visualisation
5. **Prototype du parcours 7 min** — Enchaînement des 5 phases avec l'animation de fracture
