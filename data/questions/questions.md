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

## Questions d'onboarding (15)

Ces 15 questions produisent la première image du positionnement. Elles sont posées à tous les utilisateurs lors du parcours "révélation". Trois questions par axe.

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
- **text** : "La réussite d'une personne dépend avant tout de son mérite et de ses efforts, pas de son milieu social d'origine."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : education
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = conservateur (méritocrate, mobilité individuelle possible). Pas d'accord = progressiste (inégalités structurelles, déterminisme social). Couvre une dimension sociétale complémentaire aux mœurs (Q1) et à l'identité (Q2) : la vision de la reproduction sociale et de l'égalité des chances.

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
- **text** : "Le droit de grève dans les services publics devrait être encadré pour garantir un service minimum à la population."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : travail
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (l'ordre public et l'usager priment sur le droit de grève). Pas d'accord = libertaire (le droit de grève est fondamental, même dans les services publics). Complémente Q7 (sécurité) en testant l'axe autorité dans un contexte social/travail plutôt que sécuritaire.

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

### Q13
- **id** : `onb-13`
- **text** : "En cas d'épidémie grave, l'État devrait pouvoir imposer des restrictions (confinement, pass sanitaire) sans attendre un vote du Parlement."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : sante
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (efficacité de l'exécutif en crise, urgence sanitaire). Pas d'accord = libertaire (contrôle démocratique, droits fondamentaux). Complémente Q7 (surveillance numérique) et Q8 (droit de grève) sur l'axe autorité : mesure la disposition à accepter la contrainte étatique dans un contexte de crise sanitaire.

### Q14
- **id** : `onb-14`
- **text** : "Les vols intérieurs devraient être interdits quand un trajet en train de moins de 4 heures existe."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = écologiste (sobriété imposée, réduction carbone). Pas d'accord = productiviste (liberté de déplacement, concurrence). Mesure la disposition à accepter une contrainte concrète et personnelle pour des raisons écologiques — complémente Q9 (priorité environnement) et Q10 (technologie vs sobriété).

### Q15
- **id** : `onb-15`
- **text** : "Les accords commerciaux négociés par l'Union européenne au nom de la France devraient être soumis à un référendum avant d'être signés."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : international
- **phase** : onboarding
- **weight** : 1.0
- **calibration** : D'accord = souverainiste (contrôle démocratique national, méfiance UE). Pas d'accord = mondialiste/pro-UE (délégation assumée, efficacité). Complémente Q11 (France vs règles européennes) et Q12 (mondialisation) : mesure le rapport à la délégation de souveraineté économique à l'UE.

---

## Questions d'approfondissement (54)

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

#### Q51
- **id** : `deep-travail-05`
- **text** : "Une grande entreprise rentable annonce la fermeture d'une usine de 300 salariés pour délocaliser en Asie. Que doit faire l'État ?"
- **type** : dilemme
- **axis** : economic
- **polarity** : +1
- **domain** : travail
- **phase** : deep
- **weight** : 1.5
- **options** : ["Interdire la fermeture et imposer de lourdes pénalités", "Exiger un plan social étendu et une reconversion financée par l'entreprise", "Soutenir les salariés via l'État sans contraindre l'entreprise", "Proposer des aides aux salariés licenciés et laisser l'entreprise libre", "Ne pas intervenir — c'est une décision légitime dans une économie de marché"]
- **calibration** : Option 0 = interventionniste fort (négatif économique). Option 4 = libéral (positif économique). Scénario concret qui révèle le rapport réel au rôle de l'État dans l'économie.

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
- **text** : "La police devrait avoir davantage de moyens et de marges d'action pour assurer la sécurité."
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

#### Q52
- **id** : `deep-securite-05`
- **text** : "Un adolescent de 15 ans est arrêté pour la troisième fois pour vol avec violence. Quelle réponse est la plus appropriée ?"
- **type** : dilemme
- **axis** : authority
- **polarity** : +1
- **domain** : securite
- **phase** : deep
- **weight** : 1.5
- **options** : ["Placement en centre fermé avec régime disciplinaire strict", "Suivi judiciaire renforcé avec travaux d'intérêt général", "Médiation avec les victimes et accompagnement psychologique intensif", "Accompagnement social en profondeur (famille, école, quartier)", "Traitement uniquement par les services sociaux sans sanction judiciaire"]
- **calibration** : Option 0 = autoritaire (négatif autorité). Option 4 = libertaire (positif autorité). Dilemme concret qui dépasse la rhétorique abstraite sur la justice.

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
- **text** : "Un étranger qui travaille, paie ses impôts depuis plusieurs années et respecte les lois devrait pouvoir obtenir la nationalité française."
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

#### Q53
- **id** : `deep-immigration-05`
- **text** : "Les traditions culturelles et religieuses de nos ancêtres constituent un héritage précieux qu'il faut préserver et transmettre."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.2
- **calibration** : D'accord = conservateur (identité, continuité culturelle). Pas d'accord = progressiste (ouverture, évolution des normes). Bonne question d'ancrage pour l'axe sociétal.

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
- **text** : "Il faudrait interdire les produits et pratiques les plus polluants, même si cela pénalise certains secteurs économiques."
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

#### Q54
- **id** : `deep-environnement-05`
- **text** : "L'État doit réduire les émissions de CO₂ de 50% d'ici 2035. Quelle approche soutiens-tu en priorité ?"
- **type** : dilemme
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.5
- **options** : ["Miser sur l'innovation technologique et le nucléaire sans restreindre les modes de vie", "Incitations fiscales (bonus-malus) pour orienter les comportements", "Réguler par la loi les secteurs industriels et les transports les plus polluants", "Limiter la publicité et encadrer les modes de consommation polluants", "Fixer des objectifs légaux de sobriété avec contrôle de la production et des importations"]
- **calibration** : Option 0 = productiviste/techno-optimiste (négatif écologie). Option 4 = écologiste/décroissance (positif écologie). Concrétise un débat souvent abstrait.

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

#### Q55
- **id** : `deep-economie-05`
- **text** : "Il est normal qu'un PDG d'une grande entreprise gagne 100 à 200 fois le salaire de ses employés les moins payés."
- **type** : affirmation
- **axis** : economic
- **polarity** : +1
- **domain** : economie
- **phase** : deep
- **weight** : 1.2
- **calibration** : D'accord = libéral (le marché fixe les salaires). Pas d'accord = interventionniste (inégalités injustifiées). Bonne question d'ancrage : les positions sont très tranchées selon l'axe économique.

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
- **text** : "L'intelligence artificielle devrait être réglementée par l'État."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = autoritaire (régulation). Pas d'accord = libertaire (innovation libre).

#### Q43
- **id** : `deep-numerique-03`
- **text** : "Les géants du numérique (Google, Amazon, Meta) ont trop de pouvoir et devraient être fortement régulés, voire démantelés."
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
- **text** : "Les citoyens devraient pouvoir déclencher des référendums d'initiative populaire (RIC) sur les grandes décisions qui les concernent."
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
- **text** : "Aucun élu ne devrait pouvoir exercer plus de deux mandats consécutifs dans la même fonction."
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

#### Q56
- **id** : `deep-international-03`
- **text** : "Les décisions de la Cour de justice de l'Union européenne doivent primer sur les lois françaises."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.2
- **calibration** : D'accord = mondialiste/pro-UE (positif souveraineté). Pas d'accord = souverainiste (négatif souveraineté). Bonne question d'ancrage : révèle directement le rapport à la souveraineté nationale.

---

### Domaine : Environnement et énergie (suite)

#### Q57
- **id** : `deep-ecologie-01`
- **text** : "Les pesticides de synthèse devraient être progressivement interdits dans l'agriculture, même si cela augmente les prix alimentaires."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = écologiste (accepte le coût). Pas d'accord = productiviste (économie prime). Le "même si" force à assumer le coût réel de la position.

#### Q58
- **id** : `deep-ecologie-02`
- **text** : "Les voitures thermiques devraient être interdites dans les centres-villes d'ici 2030."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = écologiste (contrainte acceptée). Pas d'accord = productiviste (liberté de circulation, coût économique). Question concrète et datée, très discriminante.

#### Q59
- **id** : `deep-ecologie-03`
- **text** : "La protection des écosystèmes naturels (forêts, zones humides, espèces menacées) devrait prendre le dessus sur les projets économiques qui les menacent."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = écologiste (biodiversité avant économie). Pas d'accord = productiviste (développement prime). Révèle le rapport à la valeur intrinsèque du vivant.

#### Q60
- **id** : `deep-ecologie-04`
- **text** : "L'élevage intensif devrait être fortement réduit d'ici 2040 pour des raisons environnementales et éthiques, même si cela fragilise la filière agricole."
- **type** : affirmation
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.2
- **calibration** : D'accord = écologiste (souffrance animale + environnement > emplois). Pas d'accord = productiviste (souveraineté alimentaire, emplois ruraux). Excellent ancrage : la mention "filière agricole" force à assumer le coût social.

#### Q61
- **id** : `deep-ecologie-05`
- **text** : "Face à la crise climatique, quel levier prioritaire l'État doit-il actionner pour changer nos modes de vie ?"
- **type** : dilemme
- **axis** : ecology
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.5
- **options** : ["Miser sur la R&D et les technologies vertes sans restreindre les modes de vie", "Inciter par des avantages fiscaux (bonus-malus) sans imposer", "Réguler les entreprises et secteurs polluants en laissant les individus libres", "Encadrer à la fois les entreprises et certains comportements de consommation", "Imposer des limites collectives contraignantes (quotas carbone, restrictions de production)"]
- **calibration** : Option 0 = productiviste/techno-optimiste. Option 4 = écologiste de la sobriété imposée. Révèle la vision du rapport individu-société sur l'écologie, au-delà des déclarations d'intention.

---

### Domaine : Souveraineté et relations internationales

#### Q62
- **id** : `deep-souverainete-01`
- **text** : "La France devrait protéger ses agriculteurs et ses industries avec des taxes à l'importation, même si cela fait monter les prix pour les consommateurs."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = souverainiste/protectionniste. Pas d'accord = mondialiste (libre-échange, prix bas). Le "même si" révèle la disposition réelle à payer le coût du protectionnisme.

#### Q63
- **id** : `deep-souverainete-02`
- **text** : "L'Union européenne devrait avoir davantage de pouvoirs communs sur les décisions économiques, sociales et de défense."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = mondialiste/fédéraliste européen. Pas d'accord = souverainiste (déléguer moins). Question clé pour distinguer pro-européen de souverainiste.

#### Q64
- **id** : `deep-souverainete-03`
- **text** : "La France devrait développer une défense européenne autonome plutôt que de rester dépendante de l'OTAN et des États-Unis."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = souverainiste (autonomie stratégique, anti-dépendance US). Pas d'accord = atlantiste/mondialiste (alliance avec les démocraties). Question utile car elle crée une tension : les gaullistes et les eurosceptiques peuvent être d'accord pour des raisons opposées.

#### Q65
- **id** : `deep-souverainete-04`
- **text** : "Les plateformes numériques étrangères (Netflix, YouTube, TikTok) devraient être obligées de financer des productions culturelles françaises pour opérer en France."
- **type** : affirmation
- **axis** : sovereignty
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord = souverainiste (protection culturelle, exception culturelle française). Pas d'accord = mondialiste (libre marché numérique). Très actuel, révèle le rapport à la souveraineté culturelle.

#### Q66
- **id** : `deep-souverainete-05`
- **text** : "Face aux grandes crises mondiales (sanitaires, climatiques, alimentaires), quel rôle la France devrait-elle jouer ?"
- **type** : dilemme
- **axis** : sovereignty
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.5
- **options** : ["Priorité absolue à la France — chaque nation gère ses propres crises", "Coopération ponctuelle avec quelques alliés proches si nécessaire", "Alliance européenne renforcée pour répondre ensemble aux crises continentales", "Coalition des démocraties à l'échelle mondiale pour les crises globales", "Renforcement des institutions internationales (ONU, OMS) avec de vrais pouvoirs contraignants"]
- **calibration** : Option 0 = souverainiste pur. Option 4 = mondialiste pur. Révèle la vision du rapport France/monde sur les enjeux qui dépassent les frontières.

---

## Statistiques de couverture

### Par axe
| Axe | Onboarding | Approfondissement | Total |
|-----|-----------|-------------------|-------|
| Sociétal | 3 | 10 | 13 |
| Économique | 3 | 14 | 17 |
| Autorité | 3 | 13 | 16 |
| Écologie | 3 | 9 | 12 |
| Souveraineté | 3 | 8 | 11 |
| **Total** | **15** | **54** | **69** |

### Par domaine
| Domaine | Onboarding | Approfondissement | Total |
|---------|-----------|-------------------|-------|
| Travail et emploi | 0 | 5 | 5 |
| Santé et protection sociale | 3 | 4 | 7 |
| Éducation et jeunesse | 0 | 4 | 4 |
| Sécurité et justice | 2 | 5 | 7 |
| Immigration et identité | 1 | 5 | 6 |
| Environnement et énergie | 3 | 10 | 13 |
| Économie et fiscalité | 3 | 5 | 8 |
| Numérique et libertés | 0 | 5 | 5 |
| Démocratie et institutions | 0 | 4 | 4 |
| International et défense | 3 | 7 | 10 |

### Par format
| Format | Onboarding | Approfondissement | Total |
|--------|-----------|-------------------|-------|
| Affirmation | 15 | 49 | 64 |
| Dilemme | 0 | 5 | 5 |

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
