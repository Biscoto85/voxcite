# VoxCité — Modèle de données

## Vue d'ensemble

Ce document décrit la structure des données de VoxCité. Il sert de référence pour l'implémentation de la base de données et des API.

---

## 1. Le compas politique

### Position sur le compas

Chaque positionnement est défini par 2 coordonnées :

```
{
  societal: float [-1.0, +1.0]    // -1 = conservateur, +1 = progressiste
  economic: float [-1.0, +1.0]    // -1 = interventionniste, +1 = libéral
}
```

Ce format s'applique à :
- La position globale d'un utilisateur (calculée depuis ses réponses)
- La position d'un utilisateur sur un thème spécifique
- La position d'un parti politique
- La position d'un média

### Calcul de la position

La position globale est la moyenne pondérée des positions par domaine.
La position par domaine est calculée depuis les réponses aux questions de ce domaine.

---

## 2. Domaines et thèmes

### Domaine

```json
{
  "id": "travail",
  "label": "Travail et emploi",
  "order": 1,
  "description": "Emploi, conditions de travail, retraites, formation",
  "dimension_societale": {
    "tension": "Droit au sens vs devoir de productivité",
    "pole_progressiste": "Semaine de 4 jours, télétravail, droit à la déconnexion",
    "pole_conservateur": "Valeur travail, effort, hiérarchie, discipline"
  },
  "dimension_economique": {
    "tension": "Protection vs flexibilité",
    "pole_interventionniste": "CDI renforcé, salaire minimum élevé, cotisations sociales",
    "pole_liberal": "Ubérisation, flexibilité, charges réduites"
  },
  "themes_permanents": ["retraites", "chomage", "temps_travail", "formation", "fonction_publique"]
}
```

### Thème permanent

```json
{
  "id": "retraites",
  "domain_id": "travail",
  "label": "Retraites",
  "description": "Âge de départ, régimes spéciaux, capitalisation vs répartition"
}
```

### Sujet d'actualité

```json
{
  "id": "reforme-chomage-2026",
  "domain_id": "travail",
  "theme_ids": ["chomage"],
  "label": "Réforme de l'assurance chômage 2026",
  "summary": "Durcissement des conditions d'indemnisation",
  "date_published": "2026-03-15",
  "date_expires": null,
  "is_active": true,
  "decryptage": {
    "qui_dit_quoi": [
      { "actor": "Gouvernement", "position": "Inciter au retour à l'emploi", "axis": "economic" },
      { "actor": "Syndicats", "position": "Précarisation des chômeurs", "axis": "economic" },
      { "actor": "Patronat", "position": "Flexibilité du marché du travail", "axis": "economic" }
    ],
    "biais_mediatiques": [
      { "source": "TF1", "biais": "Cadrage sur les 'abus' individuels" },
      { "source": "Mediapart", "biais": "Cadrage sur les conséquences sociales" }
    ],
    "enjeux_caches": "Impact sur les seniors et les contrats courts"
  }
}
```

---

## 3. Questions de positionnement

### Question

Chaque question positionne l'utilisateur sur un ou deux axes d'un domaine.

```json
{
  "id": "q-travail-01",
  "domain_id": "travail",
  "text": "Le CDI devrait rester la norme du contrat de travail en France.",
  "axis": "economic",
  "polarity": -1,
  "weight": 1.0,
  "phase": "onboarding"
}
```

- `axis` : `"societal"`, `"economic"`, ou `"both"` (rare, questions transversales)
- `polarity` : `+1` si "d'accord" pousse vers progressiste/libéral, `-1` si "d'accord" pousse vers conservateur/interventionniste
- `weight` : pondération dans le calcul de position (1.0 par défaut)
- `phase` : `"onboarding"` (parcours 7 min) ou `"deep"` (approfondissement)

### Réponse

```json
{
  "question_id": "q-travail-01",
  "value": float [-2.0, +2.0],
  "session_id": "uuid"
}
```

Échelle de réponse : Pas du tout d'accord (-2), Pas d'accord (-1), Neutre (0), D'accord (+1), Tout à fait d'accord (+2)

---

## 4. Avis citoyen

### Avis sur un sujet d'actualité

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "subject_id": "reforme-chomage-2026",
  "position": {
    "societal": 0.3,
    "economic": -0.6
  },
  "created_at": "2026-04-03T14:30:00Z",
  "device_fingerprint": "hash"
}
```

- Pas de données personnelles stockées
- `session_id` : identifiant de session anonyme (cookie/localStorage)
- `device_fingerprint` : hash pour limiter les votes multiples (anti-manipulation)

---

## 5. Synthèse collective

### Agrégation par sujet

```json
{
  "subject_id": "reforme-chomage-2026",
  "total_votes": 12847,
  "updated_at": "2026-04-03T15:00:00Z",
  "distribution": {
    "mean": { "societal": 0.12, "economic": -0.34 },
    "median": { "societal": 0.15, "economic": -0.30 },
    "std_dev": { "societal": 0.45, "economic": 0.62 }
  },
  "quadrants": {
    "progressiste_liberal": { "count": 2847, "percent": 22.2 },
    "progressiste_interventionniste": { "count": 4102, "percent": 31.9 },
    "conservateur_liberal": { "count": 3211, "percent": 25.0 },
    "conservateur_interventionniste": { "count": 2687, "percent": 20.9 }
  },
  "heatmap": "base64_or_url",
  "ai_synthesis": {
    "consensus": "Large majorité pour le maintien de protections sociales",
    "clivage_principal": "Le clivage est économique, pas sociétal sur ce sujet",
    "surprise": "Les positions conservatrices et progressistes convergent sur l'axe économique"
  }
}
```

---

## 6. Entités de référence

### Parti politique

```json
{
  "id": "lfi",
  "label": "La France Insoumise",
  "abbreviation": "LFI",
  "position": { "societal": 0.7, "economic": -0.8 },
  "color": "#CC2443",
  "leader": "Jean-Luc Mélenchon",
  "visible_on_compass": true
}
```

### Média

```json
{
  "id": "tf1",
  "label": "TF1",
  "type": "tv",
  "position": { "societal": -0.2, "economic": 0.4 },
  "owner": "Bouygues",
  "visible_on_compass": true
}
```

---

## 7. Session utilisateur

Pas de compte, pas d'authentification. L'identité est une session anonyme.

```json
{
  "session_id": "uuid",
  "created_at": "2026-04-03T14:00:00Z",
  "global_position": { "societal": 0.25, "economic": -0.15 },
  "domains_completed": ["travail", "sante"],
  "subjects_voted": ["reforme-chomage-2026"],
  "onboarding_completed": true,
  "share_count": 0
}
```

---

## 8. Contenu partageable

Généré à la fin du parcours pour le partage viral.

```json
{
  "session_id": "uuid",
  "image_url": "https://voxcite.fr/share/abc123.png",
  "text": "Je suis dans le quadrant progressiste-interventionniste. 34% des Français sont comme moi mais aucun parti ne nous représente vraiment. Et toi ? #VoxCité",
  "position": { "societal": 0.25, "economic": -0.15 },
  "quadrant": "progressiste_interventionniste",
  "stat_choc": "34% des Français sont dans ton quadrant mais aucun parti ne les représente pleinement",
  "created_at": "2026-04-03T14:35:00Z"
}
```

---

## Relations entre entités

```
Domaine (10)
  └── Thème permanent (5 par domaine ≈ 50 total)
  └── Sujet d'actualité (variable, rattaché à 1+ thèmes)
       └── Décryptage (qui dit quoi, biais, enjeux)
       └── Avis citoyens (positionnements 2D anonymes)
       └── Synthèse collective (agrégation + analyse IA)

Questions de positionnement
  └── Rattachées à 1 domaine
  └── Mesurent 1 ou 2 axes
  └── Phase onboarding ou approfondissement

Session utilisateur (anonyme)
  └── Réponses aux questions → position globale
  └── Avis sur sujets → positions par sujet
  └── Contenu partageable généré

Entités de référence
  └── Partis politiques (positionnés sur le compas)
  └── Médias (positionnés sur le compas)
```
