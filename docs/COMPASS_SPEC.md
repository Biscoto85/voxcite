# PartiPrism — Spécification technique : Compas 2D et animation de fracture

## Contexte

Ce document décrit le composant central de PartiPrism : le compas politique à 2 axes et l'animation de "fracture" qui constitue le moment clé du parcours d'onboarding. Il est destiné à être utilisé comme brief dans Claude Code pour l'implémentation.

Un prototype interactif fonctionnel a été validé. Ce document en extrait les principes pour une implémentation production-ready.

---

## 1. Le compas politique 2D

### Système de coordonnées

```
                    Libéral (+1.0)
                        |
                        |
Conservateur (-1.0) ----+---- Progressiste (+1.0)
                        |
                        |
               Interventionniste (-1.0)
```

- **Axe horizontal (x)** : sociétal. -1 = conservateur, +1 = progressiste
- **Axe vertical (y)** : économique. -1 = interventionniste, +1 = libéral
- Chaque position est un objet `{ societal: float, economic: float }` avec valeurs entre -1.0 et +1.0

### 4 quadrants

| Quadrant | Position | Exemples de sensibilité |
|----------|----------|------------------------|
| Haut-droite | Progressiste + Libéral | Socialement ouvert, économiquement pro-marché |
| Haut-gauche | Conservateur + Libéral | Valeurs traditionnelles, économie de marché |
| Bas-droite | Progressiste + Interventionniste | Socialement ouvert, État fort économiquement |
| Bas-gauche | Conservateur + Interventionniste | Valeurs traditionnelles, État protecteur |

### Éléments visuels du compas

1. **Les 2 axes** : lignes perpendiculaires avec labels aux 4 extrémités
2. **La nébuleuse collective** : nuage de points semi-transparents représentant les autres utilisateurs (200+ points avec opacité faible, simulés au lancement puis réels avec la base de données)
3. **Les partis politiques** : points colorés avec label, positionnés selon le fichier `data/parties.yaml`
4. **Le point utilisateur** : point plus gros (rayon ~9px), couleur distinctive (violet #7F77DD), avec contour blanc et label "Toi"
5. **Optionnel : les médias** : même logique que les partis, activable/désactivable

### Interactions

- Le point utilisateur se déplace en temps réel quand l'utilisateur répond à une question
- Au survol/tap sur un parti : afficher le nom complet et la position exacte
- Zoom/pan sur mobile pour explorer la nébuleuse (optionnel v1)

---

## 2. Le parcours "révélation" — 3 phases

### Phase 1 : Le piège (5 questions sur l'axe unique)

**Objectif** : Frustrer l'utilisateur avec l'axe gauche-droite classique.

**UX** :
- Afficher une barre horizontale simple avec "Gauche" à gauche et "Droite" à droite
- Un point se déplace sur cette barre à chaque réponse
- 5 questions sont posées (sélectionnées parmi les 10 d'onboarding, celles qui sont les plus "piégeantes" sur un seul axe)
- Format de réponse : 5 boutons (Pas du tout d'accord → Tout à fait d'accord)
- À la fin : afficher le résultat sur l'axe unique avec le message "Voilà ce que le système politique dit de toi. Tu te reconnais ?"

**Calcul** : Position 1D = moyenne simple des contributions de chaque réponse, projetée sur un seul axe. Volontairement réducteur.

### Phase 2 : La fracture (animation centrale)

**Objectif** : Moment émotionnel clé. L'axe unique se brise en deux axes perpendiculaires. C'est le "moment Da Vinci Code".

**Séquence d'animation** (durée totale : ~4 secondes) :

```
T=0.0s    L'axe horizontal 1D est affiché seul (état initial)
T=0.5s    Message : "Et si le problème, c'était la carte ?"
T=1.0s    L'axe vertical commence à apparaître (opacité 0→1, ease-out)
          Les labels "Libéral" et "Interventionniste" apparaissent en fondu
T=1.5s    La nébuleuse collective commence à se matérialiser
          Les points apparaissent progressivement, d'abord proches du centre puis s'étalant
T=2.5s    Les partis politiques apparaissent un par un (fondu rapide, 100ms entre chaque)
          Chaque parti apparaît avec un léger effet de "pop" (scale 0→1)
T=3.5s    Le point utilisateur se repositionne de sa position 1D vers sa position 2D
          Animation fluide (ease-in-out, ~500ms)
T=4.0s    État final stable. Tous les éléments visibles.
```

**Détails techniques de l'animation** :
- Utiliser `requestAnimationFrame` pour la fluidité
- Courbe d'accélération : cubic ease-out `1 - Math.pow(1 - t, 3)` pour l'apparition
- Le canvas doit être responsive (adapter au conteneur, gérer le devicePixelRatio pour la netteté sur Retina)
- Supporter le dark mode (couleurs des axes et labels adaptées)
- Pas de librairie d'animation nécessaire — Canvas API natif suffit

**Rendu Canvas** :
- Fond transparent (le conteneur fournit le background)
- Axes : lignes 1px, couleur subtile (gris clair en light mode, gris sombre en dark mode)
- Nébuleuse : cercles de rayon 2-4px, opacité 0.08-0.12, couleur violette
- Partis : cercles de rayon 6px, couleur selon `parties.yaml`, label 11px au-dessus
- Point utilisateur : cercle rayon 9px, #7F77DD, contour blanc 2.5px, label "Toi" 12px au-dessus

### Phase 3 : L'appropriation (5 questions restantes)

**Objectif** : L'utilisateur voit son point se déplacer en temps réel sur le compas 2D.

**UX** :
- Les 5 questions d'onboarding restantes sont posées
- À chaque réponse, le point "Toi" se déplace sur le compas avec une animation fluide (~300ms)
- Les partis et la nébuleuse restent visibles comme repères
- À la fin : afficher le résultat avec le quadrant, le parti le plus proche, et la stat choc

---

## 3. Calcul du positionnement

### Depuis les réponses

```javascript
// Chaque question a : axis ("societal", "economic", "both"), polarity (-1 ou +1), weight (1.0 ou 1.5)
// Chaque réponse a : value (-2, -1, 0, +1, +2)

function calculatePosition(responses, questions) {
  let socTotal = 0, socWeight = 0;
  let ecoTotal = 0, ecoWeight = 0;

  for (const resp of responses) {
    const q = questions.find(q => q.id === resp.question_id);
    const contribution = resp.value * q.polarity * q.weight;

    if (q.axis === "societal" || q.axis === "both") {
      socTotal += contribution;
      socWeight += Math.abs(q.weight) * 2; // 2 = max réponse possible
    }
    if (q.axis === "economic" || q.axis === "both") {
      ecoTotal += contribution;
      ecoWeight += Math.abs(q.weight) * 2;
    }
  }

  return {
    societal: socWeight > 0 ? Math.max(-1, Math.min(1, socTotal / socWeight)) : 0,
    economic: ecoWeight > 0 ? Math.max(-1, Math.min(1, ecoTotal / ecoWeight)) : 0
  };
}
```

### Stat choc personnalisée

À la fin du parcours, générer une phrase du type :
- "X% des Français sont dans ton quadrant (Progressiste-Interventionniste), mais aucun parti ne les représente pleinement."
- "Tu es plus proche de [PARTI] que tu ne le penses — mais vous divergez complètement sur l'axe [sociétal/économique]."

Pour la v1, les pourcentages par quadrant peuvent être codés en dur (estimations) :
- Progressiste + Libéral : ~18%
- Conservateur + Libéral : ~15%
- Progressiste + Interventionniste : ~35%
- Conservateur + Interventionniste : ~32%

---

## 4. Image de partage

À la fin du parcours, générer une image partageable (1080x1080 pour Instagram, 1200x675 pour Twitter).

### Contenu de l'image
- Le compas 2D avec les partis en arrière-plan (opacité réduite)
- Le point de l'utilisateur bien visible
- Le quadrant mis en valeur
- La stat choc en texte
- Le logo PartiPrism + "partiprism.fr"
- Le slogan "On fait parler la cité."

### Génération
- Côté client : canvas `toDataURL()` ou librairie comme `html2canvas`
- Côté serveur (v2) : API qui génère l'image à partir de la position, pour les liens Open Graph

---

## 5. Données de référence intégrées

Le composant doit charger :
- `data/parties.yaml` — 9 partis avec position (x, y) et couleur
- `data/questions.md` — 10 questions d'onboarding (les 40 d'approfondissement sont pour après)
- Nébuleuse : générée aléatoirement au lancement (200 points, distribution gaussienne centrée), puis remplacée par les vraies données quand la base sera en place

---

## 6. Contraintes techniques

- **Responsive** : le compas doit fonctionner aussi bien sur mobile (320px) que sur desktop (1200px)
- **Performance** : 60fps pendant l'animation de fracture, même sur mobile
- **Accessibilité** : les questions doivent être navigables au clavier, les couleurs doivent avoir un contraste suffisant
- **Dark mode** : supporter les deux thèmes
- **Pas de framework imposé** : ce document est agnostique. Le composant peut être implémenté en React, Vue, Svelte, ou vanilla JS selon le choix de stack global
- **Canvas vs SVG** : Canvas est recommandé pour le compas (performance avec 200+ points), SVG peut être utilisé pour les éléments d'interface autour

---

## 7. Fichiers liés

- `README.md` — Vision et architecture globale
- `docs/DATA_MODEL.md` — Modèle de données complet
- `data/parties.yaml` — Positions des partis politiques
- `data/questions.md` — 50 questions de positionnement (10 onboarding + 40 approfondissement)
- `data/domains.yaml` — 10 domaines thématiques
