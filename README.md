# PartiPrism

**Déplie ton spectre politique.**

> Application citoyenne qui donne les clés de compréhension du paysage politique en remplaçant l'axe unique droite-gauche par un compas à 2 axes, et permet à chaque citoyen d'exprimer son avis sur les sujets qui comptent.

---

## Vision

La représentation politique sur un seul axe (droite-gauche) est la cause fondamentale de l'incompréhension du débat public. Elle permet la fracturation du bloc populaire sur les sujets sociétaux, au profit de la minorité qui détient le pouvoir économique.

PartiPrism rend visible ce que le système cache : **le champ politique a 2 dimensions, pas 1.**

- **Axe sociétal** : progressiste ↔ conservateur
- **Axe économique** : libéral ↔ interventionniste

## Principes fondateurs

- **2 axes, pas 1** — Le compas politique à 2 dimensions est le cœur du projet
- **Simplicité radicale** — Un citoyen lambda comprend tout en 7 minutes
- **Citoyen souverain** — L'app éduque, elle ne dirige pas
- **Anonymat des contributions** — Zéro friction, zéro compte obligatoire
- **Transparence IA** — L'IA est un outil au service du citoyen, jamais l'inverse
- **Web + mobile natif** — Accessible partout, par tous

## Public cible

Grand public, 15-50 ans, souvent dégoûté de la politique et ne suivant que de loin l'actualité. L'objectif est de leur donner un sentiment de compréhension immédiat — comme une révélation.

---

## Architecture — 4 modules

### 1. Compas politique (module central)
Représentation 2D du positionnement politique. L'utilisateur se positionne via des questions simples, puis voit sa position sur la carte avec la nébuleuse collective en arrière-plan.

### 2. Décryptage médiatique
Analyse des biais médiatiques, identification des sources, construction de l'esprit critique. Chaque sujet d'actualité est décrypté avec : qui dit quoi, quels intérêts en jeu, quels biais.

### 3. Expression citoyenne
L'utilisateur donne son avis sur chaque sujet/thème. Pas un like/dislike mais un positionnement nuancé sur les 2 axes. Son point s'ajoute à la carte collective.

### 4. Synthèse collective
Agrégation des avis reçus avec visualisation des écarts, consensus et clivages. L'IA produit des synthèses honnêtes en montrant les divergences.

---

## Le parcours "révélation" — 7 minutes

Le parcours d'onboarding viral, conçu pour transformer le dégoût en lucidité.

| Phase | Durée | Nom | Principe |
|-------|-------|-----|----------|
| 1 | 90s | **Le piège** | "Tu es de droite ou de gauche ?" — On pose la question sur 1 axe. Ça coince. C'est voulu. |
| 2 | 60s | **La révélation** | L'axe unique se fracture visuellement en 2 axes. Moment "Da Vinci Code". |
| 3 | 120s | **L'appropriation** | Partis, médias, amis — tous positionnés sur le compas 2D. Les yeux s'ouvrent. |
| 4 | 90s | **La voix** | Premier sujet d'actu décrypté. Premier avis. Premier pouvoir. |
| 5 | 30s | **L'hameçon** | Résultat partageable + stat choc personnalisée. Boucle virale. |

---

## Domaines thématiques

10 domaines de vie couvrent l'intégralité du débat politique. Chacun se lit sur les 2 axes du compas.

| # | Domaine | Thèmes permanents |
|---|---------|-------------------|
| 1 | **Travail et emploi** | Retraites, chômage, temps de travail, formation, fonction publique |
| 2 | **Santé et protection sociale** | Hôpital, sécu, fin de vie, bioéthique, dépendance |
| 3 | **Éducation et jeunesse** | École publique, université, laïcité, numérique éducatif, orientation |
| 4 | **Sécurité et justice** | Police, justice, prison, terrorisme, violences |
| 5 | **Immigration et identité** | Asile, intégration, frontières, nationalité, diaspora |
| 6 | **Environnement et énergie** | Climat, énergie, agriculture, biodiversité, transports |
| 7 | **Économie et fiscalité** | Impôts, dette, pouvoir d'achat, logement, inégalités |
| 8 | **Numérique et libertés** | IA, données, réseaux sociaux, cybersécurité, souveraineté |
| 9 | **Démocratie et institutions** | Élections, parlement, décentralisation, Europe, référendum |
| 10 | **International et défense** | Défense, Europe, Afrique, commerce, diplomatie |

---

## Stack technique

TypeScript monorepo :
- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Express + Drizzle ORM + PostgreSQL
- **IA** : Claude API (Anthropic)
- **Déploiement** : PM2 + Nginx sur VPS

---

## Liens

- **Site** : [partiprism.fr](https://partiprism.fr)
- **Slogan** : *Déplie ton spectre politique.*

---

## Licence

À définir.
