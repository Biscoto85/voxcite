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

## Questions d'approfondissement (40)

Ces questions affinent le positionnement. Elles sont proposées après l'onboarding, regroupées par domaine. L'utilisateur peut choisir les domaines qui l'intéressent.

---

### Domaine : Travail et emploi

#### Q11
- **id** : `deep-travail-01`
- **text** : "Le CDI devrait rester la norme, et l'ubérisation devrait être beaucoup plus encadrée."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q12
- **id** : `deep-travail-02`
- **text** : "La semaine de 4 jours devrait être généralisée, même si ça réduit la compétitivité des entreprises."
- **type** : affirmation
- **axis** : both
- **polarity** : +1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste + interventionniste / Pas d'accord → conservateur + libéral.

#### Q13
- **id** : `deep-travail-03`
- **text** : "On devrait pouvoir toucher le RSA sans condition, même sans chercher activement un emploi."
- **type** : affirmation
- **axis** : both
- **polarity** : +1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (solidarité inconditionnelle) + interventionniste / Pas d'accord → conservateur (mérite) + libéral.

#### Q14
- **id** : `deep-travail-04`
- **text** : "L'âge de départ à la retraite devrait être le même pour tous, sans régimes spéciaux."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : travail
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (uniformité, ordre) / Pas d'accord → progressiste (prise en compte des différences).

---

### Domaine : Santé et protection sociale

#### Q15
- **id** : `deep-sante-01`
- **text** : "La PMA devrait être accessible à toutes les femmes, y compris les femmes seules et les couples de femmes."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste / Pas d'accord → conservateur.

#### Q16
- **id** : `deep-sante-02`
- **text** : "L'hôpital public devrait être le seul système de soins, sans cliniques privées."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q17
- **id** : `deep-sante-03`
- **text** : "La vaccination obligatoire est justifiée quand il y a un risque pour la santé collective."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (ordre collectif) / Pas d'accord → progressiste (liberté individuelle). Question intéressante car elle inverse le clivage habituel.

#### Q18
- **id** : `deep-sante-04`
- **text** : "Le cannabis devrait être légalisé et vendu dans un cadre réglementé, comme l'alcool."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : sante
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste / Pas d'accord → conservateur.

---

### Domaine : Éducation et jeunesse

#### Q19
- **id** : `deep-education-01`
- **text** : "Les écoles privées sous contrat ne devraient plus recevoir de financement public."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q20
- **id** : `deep-education-02`
- **text** : "Le port de signes religieux visibles devrait être interdit pour les élèves à l'université, comme au lycée."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (laïcité stricte) / Pas d'accord → progressiste (liberté d'expression).

#### Q21
- **id** : `deep-education-03`
- **text** : "L'université devrait être entièrement gratuite, y compris les grandes écoles."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q22
- **id** : `deep-education-04`
- **text** : "Les parents devraient avoir le droit de choisir librement l'école de leurs enfants, sans carte scolaire."
- **type** : affirmation
- **axis** : both
- **polarity** : +1
- **domain** : education
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → libéral (choix individuel) / Pas d'accord → interventionniste (mixité sociale organisée). Touche aussi le sociétal.

---

### Domaine : Sécurité et justice

#### Q23
- **id** : `deep-securite-01`
- **text** : "Les peines de prison devraient être beaucoup plus longues pour les récidivistes."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (répression) / Pas d'accord → progressiste (réinsertion).

#### Q24
- **id** : `deep-securite-02`
- **text** : "La police devrait porter des caméras individuelles obligatoires lors de chaque intervention."
- **type** : affirmation
- **axis** : authority
- **polarity** : +1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (contrôle de l'autorité) / Pas d'accord → conservateur (confiance en l'institution).

#### Q25
- **id** : `deep-securite-03`
- **text** : "La justice est trop laxiste en France aujourd'hui."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur / Pas d'accord → progressiste. Formulation volontairement directe et populaire.

#### Q26
- **id** : `deep-securite-04`
- **text** : "Préfères-tu investir massivement dans la prévention (éducateurs, associations), ou dans les forces de l'ordre et les prisons ?"
- **type** : dilemme
- **axis** : both
- **axes** : ["authority", "economic"]
- **polarity** : +1
- **domain** : securite
- **phase** : deep
- **weight** : 1.0
- **options** : ["Forces de l'ordre", "Plutôt sécurité", "Équilibre", "Plutôt prévention", "Prévention"]
- **calibration** : Prévention → progressiste + interventionniste social / Sécurité → conservateur + libéral.

---

### Domaine : Immigration et identité

#### Q27
- **id** : `deep-immigration-01`
- **text** : "Un immigré qui travaille et paie ses impôts depuis 5 ans devrait être automatiquement régularisé."
- **type** : affirmation
- **axis** : both
- **axes** : ["societal", "sovereignty"]
- **polarity** : +1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste + interventionniste (régularisation) / Pas d'accord → conservateur + libéral (immigration choisie).

#### Q28
- **id** : `deep-immigration-02`
- **text** : "Pour devenir français, il devrait être obligatoire de maîtriser la langue et d'adhérer aux valeurs de la République."
- **type** : affirmation
- **axis** : societal
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (assimilation) / Pas d'accord → progressiste (intégration souple).

#### Q29
- **id** : `deep-immigration-03`
- **text** : "La France devrait consacrer 1% de son PIB à l'aide au développement pour réduire l'immigration à la source."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste (solidarité internationale) / Pas d'accord → libéral (réduire les dépenses).

#### Q30
- **id** : `deep-immigration-04`
- **text** : "La double nationalité devrait être supprimée : on est français ou on ne l'est pas."
- **type** : affirmation
- **axis** : societal
- **axes** : ["societal", "sovereignty"]
- **polarity** : -1
- **domain** : immigration
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (identité nationale stricte) / Pas d'accord → progressiste (identités multiples).

---

### Domaine : Environnement et énergie

#### Q31
- **id** : `deep-environnement-01`
- **text** : "Le nucléaire est indispensable pour réussir la transition écologique."
- **type** : affirmation
- **axis** : economic
- **axes** : ["economic", "ecology"]
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : Question transversale qui ne suit pas les clivages classiques. Pro-nucléaire = souvent libéral-pragmatique / Anti-nucléaire = souvent interventionniste-écologiste.

#### Q32
- **id** : `deep-environnement-02`
- **text** : "Il faudrait interdire la vente de viande issue de l'élevage intensif, même si ça fait monter les prix."
- **type** : affirmation
- **axis** : ecology
- **axes** : ["ecology", "economic"]
- **polarity** : +1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste + interventionniste / Pas d'accord → conservateur + libéral.

#### Q33
- **id** : `deep-environnement-03`
- **text** : "Les entreprises qui polluent devraient payer une taxe carbone très élevée, quitte à délocaliser."
- **type** : affirmation
- **axis** : economic
- **axes** : ["economic", "ecology"]
- **polarity** : -1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral. Le "quitte à délocaliser" force à assumer le coût économique.

#### Q34
- **id** : `deep-environnement-04`
- **text** : "Préfères-tu qu'on laisse chacun libre de ses choix de consommation, ou qu'on impose des normes écologiques strictes à tous ?"
- **type** : dilemme
- **axis** : both
- **axes** : ["ecology", "authority"]
- **polarity** : -1
- **domain** : environnement
- **phase** : deep
- **weight** : 1.0
- **options** : ["Liberté totale", "Plutôt liberté", "Équilibre", "Plutôt normes", "Normes strictes"]
- **calibration** : Liberté → libéral + conservateur / Normes → interventionniste + progressiste.

---

### Domaine : Économie et fiscalité

#### Q35
- **id** : `deep-economie-01`
- **text** : "L'ISF (impôt sur la fortune) devrait être rétabli et renforcé."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q36
- **id** : `deep-economie-02`
- **text** : "Le prix des loyers devrait être plafonné par l'État dans toutes les grandes villes."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral. Sujet concret qui touche directement le quotidien.

#### Q37
- **id** : `deep-economie-03`
- **text** : "Les aides sociales sont trop élevées en France et découragent le travail."
- **type** : affirmation
- **axis** : both
- **polarity** : -1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → libéral + conservateur (mérite, responsabilité) / Pas d'accord → interventionniste + progressiste (solidarité).

#### Q38
- **id** : `deep-economie-04`
- **text** : "La France devrait avoir un revenu universel versé à tous, sans condition."
- **type** : affirmation
- **axis** : both
- **polarity** : +1
- **domain** : economie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste + interventionniste / Pas d'accord → conservateur + libéral. Question clivante qui mélange les camps habituels.

---

### Domaine : Numérique et libertés

#### Q39
- **id** : `deep-numerique-01`
- **text** : "Les réseaux sociaux devraient vérifier l'identité réelle de chaque utilisateur pour lutter contre le harcèlement."
- **type** : affirmation
- **axis** : authority
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (ordre, responsabilité) / Pas d'accord → progressiste (anonymat, vie privée). Question qui fait écho à la réflexion fondatrice de PartiPrism.

#### Q40
- **id** : `deep-numerique-02`
- **text** : "Les GAFAM (Google, Apple, Amazon, Meta) devraient être démantelées car elles ont trop de pouvoir."
- **type** : affirmation
- **axis** : economic
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste / Pas d'accord → libéral.

#### Q41
- **id** : `deep-numerique-03`
- **text** : "L'intelligence artificielle devrait être très strictement réglementée par l'État, même si ça freine l'innovation."
- **type** : affirmation
- **axis** : both
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → interventionniste + conservateur (précaution) / Pas d'accord → libéral + progressiste (innovation).

#### Q42
- **id** : `deep-numerique-04`
- **text** : "Les enfants de moins de 16 ans ne devraient pas avoir accès aux réseaux sociaux, même avec l'accord de leurs parents."
- **type** : affirmation
- **axis** : societal
- **axes** : ["societal", "authority"]
- **polarity** : -1
- **domain** : numerique
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (protection, autorité) / Pas d'accord → progressiste (liberté, responsabilité parentale).

---

### Domaine : Démocratie et institutions

#### Q43
- **id** : `deep-democratie-01`
- **text** : "Les citoyens devraient pouvoir déclencher un référendum sur n'importe quel sujet avec suffisamment de signatures (RIC)."
- **type** : affirmation
- **axis** : societal
- **axes** : ["societal", "authority"]
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (démocratie directe) / Pas d'accord → conservateur (démocratie représentative).

#### Q44
- **id** : `deep-democratie-02`
- **text** : "Le cumul des mandats devrait être totalement interdit, et aucun élu ne devrait faire plus de deux mandats."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (renouvellement) / Pas d'accord → conservateur (expérience, stabilité).

#### Q45
- **id** : `deep-democratie-03`
- **text** : "Les élections législatives devraient se faire à la proportionnelle intégrale."
- **type** : affirmation
- **axis** : societal
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (représentativité) / Pas d'accord → conservateur (gouvernabilité).

#### Q46
- **id** : `deep-democratie-04`
- **text** : "Préfères-tu un président fort qui peut décider vite, ou un parlement fort qui oblige au compromis ?"
- **type** : dilemme
- **axis** : authority
- **polarity** : +1
- **domain** : democratie
- **phase** : deep
- **weight** : 1.0
- **options** : ["Président fort", "Plutôt président", "Équilibre", "Plutôt parlement", "Parlement fort"]
- **calibration** : Président fort → conservateur (autorité) / Parlement → progressiste (délibération).

---

### Domaine : International et défense

#### Q47
- **id** : `deep-international-01`
- **text** : "La France devrait augmenter son budget militaire à 3% du PIB, même si ça se fait au détriment des dépenses sociales."
- **type** : affirmation
- **axis** : both
- **axes** : ["sovereignty", "economic"]
- **polarity** : -1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → conservateur (puissance) + libéral (priorité régalienne) / Pas d'accord → progressiste (paix) + interventionniste (priorité sociale).

#### Q48
- **id** : `deep-international-02`
- **text** : "La France devrait arrêter de vendre des armes aux pays qui ne respectent pas les droits de l'homme."
- **type** : affirmation
- **axis** : societal
- **axes** : ["societal", "sovereignty"]
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → progressiste (droits de l'homme) / Pas d'accord → conservateur (intérêts nationaux, pragmatisme).

#### Q49
- **id** : `deep-international-03`
- **text** : "Les accords de libre-échange (CETA, Mercosur) sont une bonne chose pour l'économie française."
- **type** : affirmation
- **axis** : economic
- **axes** : ["economic", "sovereignty"]
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **calibration** : D'accord → libéral / Pas d'accord → interventionniste (protectionnisme).

#### Q50
- **id** : `deep-international-04`
- **text** : "Préfères-tu que la France agisse seule pour défendre ses intérêts, ou qu'elle s'appuie sur des alliances internationales comme l'OTAN ou l'UE ?"
- **type** : dilemme
- **axis** : sovereignty
- **polarity** : +1
- **domain** : international
- **phase** : deep
- **weight** : 1.0
- **options** : ["Seule", "Plutôt seule", "Selon les cas", "Plutôt alliances", "Alliances"]
- **calibration** : Seule → conservateur + interventionniste (souverainisme) / Alliances → progressiste + libéral (multilatéralisme).

---

## Statistiques de couverture

### Par axe
| Axe | Onboarding | Approfondissement | Total |
|-----|-----------|-------------------|-------|
| Sociétal | 3 | 15 | 18 |
| Économique | 3 | 11 | 14 |
| Autorité | 2 | 4 | 6 |
| Écologie | 2 | 4 | 6 |
| Souveraineté | 2 | 4 | 6 |
| **Total** | **12** | **40** | **52** |

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
| International et défense | 2 | 4 | 6 |

### Par format
| Format | Onboarding | Approfondissement | Total |
|--------|-----------|-------------------|-------|
| Affirmation | 12 | 34 | 46 |
| Dilemme | 0 | 6 | 6 |

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
