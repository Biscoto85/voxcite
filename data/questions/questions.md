# PartiPrism — Questions de positionnement

## Format de réponse

Toutes les questions utilisent une échelle à 5 niveaux :

- **Affirmations** : Pas du tout d'accord (-2) / Pas d'accord (-1) / Neutre (0) / D'accord (+1) / Tout à fait d'accord (+2)
- **Dilemmes** : Les 5 options sont spécifiques à chaque question (voir entre crochets)

## Champs

- `id` : identifiant unique
- `text` : la question telle qu'affichée à l'utilisateur
- `type` : `affirmation` ou `dilemme`
- `axis` : axe principal — `societal`, `economic`, `authority`, `ecology`, `sovereignty`, `both` (sociétal+économique), `all` (les 5 axes)
- `axes` : (optionnel) liste d'axes pour les questions multi-axes, ex. `["societal", "authority"]`
- `polarity` : sens du score quand l'utilisateur répond positivement (+1 = d'accord pousse vers progressiste/libéral, -1 = d'accord pousse vers conservateur/interventionniste)
- `domain` : domaine thématique principal
- `phase` : `onboarding` (10 premières questions) ou `deep` (approfondissement)
- `weight` : pondération (1.0 par défaut, 1.5 pour les questions très discriminantes)

---

## Questions d'onboarding (12)

Ces 12 questions produisent la première image du positionnement. Elles sont posées à tous les utilisateurs lors du parcours "révélation". Deux questions par axe.

### Axe sociétal

### Q1
- **id** : `onb-01`
- **text** : "Les couples de même sexe devraient avoir exactement les mêmes droits que les autres, y compris l'adoption."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : sante
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = progressiste. Pas d'accord = conservateur. Sujet clair, pas d'ambiguïté, mesure le rapport aux évolutions de mœurs.

### Q2
- **id** : `onb-02`
- **text** : "La France a une identité culturelle forte qu'il faut protéger face aux influences extérieures."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : immigration
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = conservateur. Pas d'accord = progressiste. Formulation respectueuse des deux camps. Pas de mention d'immigration directement — mesure le rapport à l'identité.

### Q3
- **id** : `onb-03`
- **text** : "Chacun devrait pouvoir choisir librement sa fin de vie, y compris l'euthanasie."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : sante
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = progressiste. Pas d'accord = conservateur. Touche à la liberté individuelle vs valeurs morales collectives.

### Axe économique

### Q4
- **id** : `onb-04`
- **text** : "L'État devrait posséder et gérer les services essentiels comme l'énergie, les transports et la santé."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral. Question fondamentale sur le rôle de l'État dans l'économie.

### Q5
- **id** : `onb-05`
- **text** : "Les impôts et les charges sur les entreprises sont trop élevés en France."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : economie
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = libéral. Pas d'accord = interventionniste. Formulation directe, les deux positions sont défendables.

### Q6
- **id** : `onb-06`
- **text** : "Les grandes fortunes devraient être beaucoup plus taxées pour financer les services publics."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral. Pas de montant précis, mesure la direction.

### Axe autorité

### Q7
- **id** : `onb-07`
- **text** : "L'État devrait pouvoir surveiller les communications numériques pour assurer la sécurité du pays."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = autoritaire. Pas d'accord = libertaire. Sujet clair, pas de mélange.

### Q8
- **id** : `onb-08`
- **text** : "La justice est trop laxiste en France : il faut des peines plus sévères."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = autoritaire. Pas d'accord = libertaire. Formulation populaire, les deux camps se reconnaissent.

### Axe écologie

### Q9
- **id** : `onb-09`
- **text** : "La protection de l'environnement devrait passer avant la croissance économique."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = écologiste. Pas d'accord = productiviste. Question nette, un seul enjeu.

### Q10
- **id** : `onb-10`
- **text** : "La technologie et l'innovation sont la meilleure réponse aux problèmes écologiques, pas la sobriété."
- **type** : affirmation
- **axis** : ecology
- **polarity** : -1
- **domain** : environnement
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = productiviste (techno-optimiste). Pas d'accord = écologiste (sobriété). Mesure le rapport à la croissance verte vs décroissance.

### Axe souveraineté

### Q11
- **id** : `onb-11`
- **text** : "La France devrait pouvoir décider seule de ses lois, sans être soumise aux règles européennes."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : international
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = souverainiste. Pas d'accord = mondialiste/pro-UE.

### Q12
- **id** : `onb-12`
- **text** : "La mondialisation est globalement une bonne chose pour la France."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : +1
- **domain** : international
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = mondialiste. Pas d'accord = souverainiste. Question simple, directe, réponse rapide.

---

## Questions d'approfondissement (38)

Ces questions affinent le positionnement. Elles sont proposées après l'onboarding, regroupées par domaine. L'utilisateur peut choisir les domaines qui l'intéressent.

---

### Domaine : Travail et emploi

#### Q13
- **id** : `deep-travail-01`
- **text** : "Le contrat de travail stable (CDI) devrait rester la norme en France."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste (protection). Pas d'accord = libéral (flexibilité).

#### Q14
- **id** : `deep-travail-02`
- **text** : "Le temps de travail hebdomadaire devrait être réduit."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste (rapport au travail). Pas d'accord = conservateur (valeur travail).

#### Q15
- **id** : `deep-travail-03`
- **text** : "Il est normal que certains métiers pénibles permettent de partir en retraite plus tôt."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste (protection différenciée). Pas d'accord = libéral (uniformité, coût).

#### Q16
- **id** : `deep-travail-04`
- **text** : "Les aides sociales découragent le travail."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libéral (responsabilité individuelle). Pas d'accord = interventionniste (filet de sécurité).

---

### Domaine : Santé et protection sociale

#### Q17
- **id** : `deep-sante-01`
- **text** : "La santé devrait être entièrement gratuite pour tous, financée par l'impôt."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral.

#### Q18
- **id** : `deep-sante-02`
- **text** : "Le cannabis devrait être légalisé et réglementé comme l'alcool."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste. Pas d'accord = conservateur.

#### Q19
- **id** : `deep-sante-03`
- **text** : "La vaccination devrait être obligatoire quand il y a un risque pour la santé collective."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (santé collective prime). Pas d'accord = libertaire (liberté individuelle).

#### Q20
- **id** : `deep-sante-04`
- **text** : "Les cliniques privées jouent un rôle utile dans le système de soins."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libéral. Pas d'accord = interventionniste.

---

### Domaine : Éducation et jeunesse

#### Q21
- **id** : `deep-education-01`
- **text** : "L'école devrait avant tout transmettre les savoirs et la discipline."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = conservateur (transmission). Pas d'accord = progressiste (épanouissement).

#### Q22
- **id** : `deep-education-02`
- **text** : "Les parents devraient pouvoir choisir librement l'école de leurs enfants."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libéral (libre choix). Pas d'accord = interventionniste (mixité sociale organisée).

#### Q23
- **id** : `deep-education-03`
- **text** : "L'enseignement supérieur devrait être entièrement gratuit."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral.

#### Q24
- **id** : `deep-education-04`
- **text** : "Les signes religieux visibles n'ont pas leur place dans les établissements scolaires publics."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (l'État impose la neutralité). Pas d'accord = libertaire (liberté d'expression).

---

### Domaine : Sécurité et justice

#### Q25
- **id** : `deep-securite-01`
- **text** : "La police devrait avoir plus de moyens et plus de liberté d'action."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire. Pas d'accord = libertaire.

#### Q26
- **id** : `deep-securite-02`
- **text** : "La prévention et l'éducation sont plus efficaces que la répression pour lutter contre la délinquance."
- **type** : affirmation
- **axis** : authority
- **polarity** : +1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libertaire (prévention). Pas d'accord = autoritaire (répression).

#### Q27
- **id** : `deep-securite-03`
- **text** : "Les caméras de surveillance dans l'espace public améliorent la sécurité."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (surveillance acceptée). Pas d'accord = libertaire (vie privée).

#### Q28
- **id** : `deep-securite-04`
- **text** : "Les policiers devraient porter des caméras individuelles lors de chaque intervention."
- **type** : affirmation
- **axis** : authority
- **polarity** : +1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libertaire (contrôle du pouvoir). Pas d'accord = autoritaire (confiance en l'institution).

---

### Domaine : Immigration et identité

#### Q29
- **id** : `deep-immigration-01`
- **text** : "La France accueille trop de personnes étrangères par rapport à sa capacité d'intégration."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = conservateur. Pas d'accord = progressiste. Formulation modérée.

#### Q30
- **id** : `deep-immigration-02`
- **text** : "Un étranger qui travaille et paie ses impôts depuis longtemps devrait obtenir la nationalité facilement."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste. Pas d'accord = conservateur.

#### Q31
- **id** : `deep-immigration-03`
- **text** : "Pour devenir Français, il est essentiel de maîtriser la langue et d'adhérer aux valeurs de la République."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (assimilation exigée). Pas d'accord = libertaire (intégration souple).

#### Q32
- **id** : `deep-immigration-04`
- **text** : "La France devrait consacrer beaucoup plus de moyens à l'aide au développement des pays pauvres."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : +1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = mondialiste (solidarité internationale). Pas d'accord = souverainiste (priorité nationale).

---

### Domaine : Environnement et énergie

#### Q33
- **id** : `deep-environnement-01`
- **text** : "Le nucléaire est indispensable pour répondre aux enjeux énergétiques."
- **type** : affirmation
- **axis** : ecology
- **polarity** : -1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = productiviste/techno-optimiste. Pas d'accord = écologiste/anti-nucléaire.

#### Q34
- **id** : `deep-environnement-02`
- **text** : "Il faudrait interdire les produits et pratiques les plus polluants, quitte à limiter certaines libertés."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = écologiste (régulation). Pas d'accord = productiviste (liberté).

#### Q35
- **id** : `deep-environnement-03`
- **text** : "Les entreprises polluantes devraient payer une taxe proportionnelle à leur pollution."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = écologiste. Pas d'accord = productiviste.

#### Q36
- **id** : `deep-environnement-04`
- **text** : "La chasse est une tradition rurale qui doit être préservée."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = conservateur (traditions). Pas d'accord = progressiste (droits des animaux). Révèle bien le clivage rural/urbain sur l'axe sociétal.

---

### Domaine : Économie et fiscalité

#### Q37
- **id** : `deep-economie-01`
- **text** : "Le marché libre, sans trop de régulation, crée plus de richesse pour tout le monde."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libéral. Pas d'accord = interventionniste.

#### Q38
- **id** : `deep-economie-02`
- **text** : "L'État devrait fixer un prix maximum pour les loyers dans les grandes villes."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral.

#### Q39
- **id** : `deep-economie-03`
- **text** : "Chaque citoyen devrait recevoir un revenu de base inconditionnel."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste (redistribution universelle). Pas d'accord = libéral (incitation au travail).

#### Q40
- **id** : `deep-economie-04`
- **text** : "L'héritage important devrait être lourdement taxé pour réduire les inégalités de départ."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral.

---

### Domaine : Numérique et libertés

#### Q41
- **id** : `deep-numerique-01`
- **text** : "Les réseaux sociaux devraient vérifier l'identité réelle de chaque utilisateur."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (responsabilité). Pas d'accord = libertaire (anonymat, vie privée).

#### Q42
- **id** : `deep-numerique-02`
- **text** : "L'intelligence artificielle devrait être strictement réglementée par l'État."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (régulation). Pas d'accord = libertaire (innovation libre).

#### Q43
- **id** : `deep-numerique-03`
- **text** : "Les géants du numérique (Google, Amazon, Meta) ont trop de pouvoir et devraient être démantelés."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = interventionniste. Pas d'accord = libéral.

#### Q44
- **id** : `deep-numerique-04`
- **text** : "Les enfants devraient être interdits de réseaux sociaux jusqu'à un certain âge."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (protection par l'interdit). Pas d'accord = libertaire (responsabilité parentale).

---

### Domaine : Démocratie et institutions

#### Q45
- **id** : `deep-democratie-01`
- **text** : "Les citoyens devraient pouvoir déclencher un référendum sur n'importe quel sujet."
- **type** : affirmation
- **axis** : authority
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = libertaire (pouvoir au peuple). Pas d'accord = autoritaire (stabilité institutionnelle).

#### Q46
- **id** : `deep-democratie-02`
- **text** : "Les élections législatives devraient se faire à la proportionnelle."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste (représentativité). Pas d'accord = conservateur (gouvernabilité, tradition institutionnelle).

#### Q47
- **id** : `deep-democratie-03`
- **text** : "Un président fort qui décide vite est préférable à un parlement qui négocie lentement."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (verticalité). Pas d'accord = libertaire (délibération).

#### Q48
- **id** : `deep-democratie-04`
- **text** : "Aucun élu ne devrait pouvoir faire plus de deux mandats."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste (renouvellement). Pas d'accord = conservateur (expérience, continuité).

---

### Domaine : International et défense

#### Q49
- **id** : `deep-international-01`
- **text** : "La France devrait renforcer sa défense militaire, même au détriment d'autres budgets."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = souverainiste (puissance nationale). Pas d'accord = mondialiste (coopération, budget social).

#### Q50
- **id** : `deep-international-02`
- **text** : "La France devrait arrêter de vendre des armes aux pays qui ne respectent pas les droits de l'homme."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = progressiste (éthique). Pas d'accord = conservateur (intérêt national, pragmatisme).

---

## Statistiques de couverture

### Par axe
| Axe | Onboarding | Approfondissement | Total |
|-----|-----------|-------------------|-------|
| Sociétal | 3 | 9 | 12 |
| Économique | 3 | 12 | 15 |
| Autorité | 2 | 12 | 14 |
| Écologie | 2 | 3 | 5 |
| Souveraineté | 2 | 2 | 4 |
| **Total** | **12** | **38** | **50** |

### Par domaine
| Domaine | Onboarding | Approfondissement | Total |
|---------|-----------|-------------------|-------|
| Travail et emploi | 0 | 4 | 4 |
| Santé et protection sociale | 2 | 4 | 6 |
| Éducation et jeunesse | 0 | 4 | 4 |
| Sécurité et justice | 2 | 4 | 6 |
| Immigration et identité | 1 | 4 | 5 |
| Environnement et énergie | 2 | 4 | 6 |
| Économie et fiscalité | 3 | 4 | 7 |
| Numérique et libertés | 0 | 4 | 4 |
| Démocratie et institutions | 0 | 4 | 4 |
| International et défense | 2 | 2 | 4 |

### Par format
| Format | Onboarding | Approfondissement | Total |
|--------|-----------|-------------------|-------|
| Affirmation | 12 | 38 | 50 |
| Dilemme | 0 | 0 | 0 |

---

## Notes de conception

### Principes de formulation
- **Langage courant** : un ado de 16 ans doit comprendre sans dictionnaire
- **Pas de biais de désirabilité** : les deux réponses sont défendables
- **Le "même si" est stratégique** : il force à assumer le coût de sa position
- **Les dilemmes cassent le rythme** : placés tous les 4-5 questions pour relancer l'attention

### Calibration à faire
Les polarités et poids sont des estimations initiales. Ils devront être affinés par :
1. Un test sur un panel de 50+ personnes aux positions connues
2. Une analyse statistique de la corrélation entre réponses et positionnement attendu
3. Un ajustement itératif des poids pour que le compas reflète fidèlement les positions

### Questions sensibles
Certaines questions (Q4, Q25, Q28, Q30) touchent des sujets où l'autocensure est forte. La formulation a été choisie pour être modérée tout en restant discriminante. Le format anonyme de PartiPrism est un atout majeur ici.
