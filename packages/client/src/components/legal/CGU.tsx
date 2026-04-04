interface CGUProps {
  onBack: () => void;
  onNavigateMentions: () => void;
}

export function CGU({ onBack, onNavigateMentions }: CGUProps) {
  return (
    <section className="max-w-2xl mx-auto" aria-label="Conditions Générales d'Utilisation">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Conditions Générales d'Utilisation</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300 focus-ring rounded py-1 px-2">
          ← Retour
        </button>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <p className="text-xs text-gray-500">Dernière mise à jour : avril 2026</p>

        <p>
          Le présent document constitue les Conditions Générales d'Utilisation (ci-après « CGU »)
          de la plateforme Parti-Prism, accessible à l'adresse{' '}
          <a href="https://partiprism.fr" className="text-purple-400 hover:text-purple-300 underline">
            https://partiprism.fr
          </a>{' '}
          et via les applications mobiles associées (ci-après « la Plateforme »).
        </p>
        <p>
          L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.
          Si vous n'acceptez pas ces conditions, vous êtes invité à ne pas utiliser la Plateforme.
        </p>

        {/* Article 1 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 1 — Objet de la Plateforme</h3>

          <h4 className="font-medium text-white mt-3 mb-1">1.1 — Description</h4>
          <p>
            Parti-Prism est un outil pédagogique et interactif dont l'unique vocation est de proposer
            des clés de lecture du paysage politique en le décomposant selon plusieurs axes d'analyse
            (sociétal, économique, autorité, écologie, souveraineté et tout autre axe ajouté ultérieurement).
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">1.2 — Nature du service</h4>
          <p>La Plateforme est un outil d'aide à la réflexion personnelle. Elle ne constitue en aucun cas :</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-gray-400">
            <li>un organe de presse ou un média d'information au sens de la loi du 29 juillet 1881 sur la liberté de la presse ;</li>
            <li>un sondage d'opinion au sens de la loi n° 77-808 du 19 juillet 1977 ;</li>
            <li>un instrument de propagande ou de promotion en faveur d'un parti politique, d'un candidat, d'un courant idéologique ou d'une organisation ;</li>
            <li>un conseil en matière politique, juridique, ou de quelque nature que ce soit.</li>
          </ul>

          <h4 className="font-medium text-white mt-4 mb-1">1.3 — Outil pédagogique, non éditorial</h4>
          <p>
            La Plateforme ne produit pas de contenu éditorial. Elle ne formule aucune opinion, ne prend aucune
            position politique, et ne recommande aucun parti, candidat ou orientation. Les contenus présentés
            (positionnements de partis, de médias, analyses thématiques, décryptages) sont le résultat de
            synthèses générées par des systèmes d'intelligence artificielle selon des instructions (prompts)
            consultables par les utilisateurs et améliorés progressivement sur la base des retours produits
            par les utilisateurs eux-mêmes.
          </p>
        </article>

        {/* Article 2 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 2 — Fonctionnement et méthodologie</h3>

          <h4 className="font-medium text-white mt-3 mb-1">2.1 — Positionnement des utilisateurs</h4>
          <p>
            Le positionnement de l'utilisateur sur les différents axes est calculé automatiquement à partir
            de ses réponses à des questions formulées par l'équipe de la Plateforme. Ce positionnement est
            une représentation schématique et simplifiée, à visée pédagogique. Il ne prétend pas refléter
            de manière exhaustive, scientifique ou définitive les opinions réelles de l'utilisateur.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">2.2 — Positionnement des partis politiques et des médias</h4>
          <p>
            Le positionnement des partis politiques, des médias et de toute autre entité sur les axes
            de la Plateforme résulte de synthèses produites par des systèmes d'intelligence artificielle.
            Ces positionnements sont des estimations à visée pédagogique, fondées sur l'analyse des
            programmes publics, des votes parlementaires, des déclarations publiques et de toute autre
            source publiquement accessible.
          </p>
          <p className="mt-2">
            Ces positionnements ne constituent en aucun cas des jugements de valeur, des qualifications
            officielles, des accusations, ni des prises de position de la Plateforme. Ils sont susceptibles
            de contenir des approximations, des erreurs ou des biais inhérents aux modèles d'intelligence
            artificielle utilisés.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">2.3 — Synthèses et décryptages</h4>
          <p>
            Les contenus présentés sous forme de décryptages, synthèses, analyses ou tout autre format
            rédactionnel sont intégralement générés par des systèmes d'intelligence artificielle. Ces contenus :
          </p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-gray-400">
            <li>ne sont pas rédigés, relus ou validés par des journalistes, des politologues ou des experts ;</li>
            <li>ne constituent pas des faits vérifiés ni des informations au sens journalistique du terme ;</li>
            <li>sont susceptibles de contenir des inexactitudes, des omissions, des simplifications excessives ou des biais ;</li>
            <li>sont fournis à titre indicatif et pédagogique uniquement.</li>
          </ul>

          <h4 className="font-medium text-white mt-4 mb-1">2.4 — Transparence des prompts</h4>
          <p>
            Les instructions (prompts) transmises aux systèmes d'intelligence artificielle pour générer
            les contenus de la Plateforme sont consultables par les utilisateurs. Ces prompts sont améliorés
            de manière itérative sur la base des retours et suggestions des utilisateurs, dans une démarche
            de transparence et d'amélioration continue.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">2.5 — Synthèse collective</h4>
          <p>
            Les synthèses collectives présentées sur la Plateforme (agrégation des réponses des utilisateurs,
            visualisation des tendances, statistiques par quadrant ou par axe) sont des représentations
            automatisées des données collectées. Elles ne constituent en aucun cas un sondage d'opinion et
            ne prétendent pas être représentatives de l'opinion publique française ou de quelque population
            que ce soit.
          </p>
        </article>

        {/* Article 3 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 3 — Exclusion de responsabilité</h3>

          <h4 className="font-medium text-white mt-3 mb-1">3.1 — Absence de responsabilité éditoriale</h4>
          <p>
            La Plateforme décline toute responsabilité éditoriale quant aux contenus générés par les systèmes
            d'intelligence artificielle. L'éditeur de la Plateforme n'exerce aucun contrôle éditorial préalable
            sur les synthèses, décryptages, positionnements et tout autre contenu automatiquement généré.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">3.2 — Absence de garantie d'exactitude</h4>
          <p>
            La Plateforme ne garantit en aucun cas l'exactitude, l'exhaustivité, la pertinence, l'actualité
            ou la fiabilité des informations et contenus présentés. Les contenus sont fournis « en l'état »,
            sans garantie d'aucune sorte, expresse ou implicite.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">3.3 — Absence de responsabilité quant à l'utilisation</h4>
          <p>
            La Plateforme ne saurait être tenue responsable de l'utilisation que les utilisateurs font des
            informations et contenus mis à leur disposition, ni des décisions, opinions, actions ou
            comportements qui pourraient en résulter. L'utilisateur est seul responsable de l'interprétation
            et de l'usage qu'il fait des contenus de la Plateforme.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">3.4 — Absence de responsabilité quant aux contributions</h4>
          <p>
            La Plateforme ne saurait être tenue responsable des réponses, avis, opinions ou contributions
            formulés par les utilisateurs. Ces contributions sont anonymes et ne sont ni modérées, ni
            validées, ni approuvées par l'éditeur de la Plateforme.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">3.5 — Limitation de responsabilité</h4>
          <p>
            Dans les limites autorisées par la loi applicable, la responsabilité de l'éditeur ne saurait
            être engagée pour quelque dommage que ce soit, direct ou indirect, matériel ou immatériel,
            résultant de l'accès à la Plateforme, de son utilisation ou de l'impossibilité de l'utiliser.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">3.6 — Force majeure et disponibilité</h4>
          <p>
            La Plateforme est fournie sans garantie de disponibilité, de continuité ou d'absence d'erreurs
            techniques. L'éditeur se réserve le droit de suspendre, modifier ou interrompre tout ou partie
            de la Plateforme à tout moment, sans préavis.
          </p>
        </article>

        {/* Article 4 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 4 �� Anonymat par conception</h3>

          <h4 className="font-medium text-white mt-3 mb-1">4.1 — Architecture anonyme</h4>
          <p>
            La Plateforme a été conçue selon le principe d'anonymat par conception (<em>privacy by design</em>).
            Aucune donnée personnelle n'est collectée, traitée ou stockée sur les serveurs de la Plateforme.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">4.2 — Traitement côté client</h4>
          <p>
            Le calcul du positionnement politique de l'utilisateur est effectué intégralement dans son
            navigateur (JavaScript côté client). Le serveur ne reçoit à aucun moment le profil complet
            d'un utilisateur.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">4.3 — Données transmises au serveur</h4>
          <p>Le serveur ne reçoit que des contributions individuelles véritablement anonymes :</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-gray-400">
            <li>des votes individuels sur des questions (sans identifiant de session ni moyen de les lier entre eux) ;</li>
            <li>des points de position agrégés sur la carte collective (sans identifiant) ;</li>
            <li>des propositions et retours textuels (sans identifiant).</li>
          </ul>

          <h4 className="font-medium text-white mt-4 mb-1">4.4 — Absence de session serveur</h4>
          <p>
            Il n'existe aucune session utilisateur côté serveur. L'expérience personnalisée (compas,
            position, historique des réponses) est stockée exclusivement dans le navigateur de l'utilisateur
            (localStorage). L'effacement de ces données se fait en vidant le stockage local du navigateur.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">4.5 — Anti-manipulation sans traçage</h4>
          <p>
            La prévention de la manipulation des résultats collectifs repose sur une limitation du nombre
            de requêtes par adresse IP (rate limiting). L'adresse IP n'est pas stockée et ne fait l'objet
            d'aucun enregistrement en base de données.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">4.6 — Absence de données personnelles</h4>
          <p>
            Aucune donnée traitée par la Plateforme ne permet, directement ou indirectement, d'identifier
            un utilisateur. Les données stockées sur les serveurs sont véritablement anonymes au sens du
            considérant 26 du RGPD et ne constituent pas des données à caractère personnel.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">4.7 — Contact</h4>
          <p>
            Pour toute question relative au traitement des données :{' '}
            <a href="mailto:contact@partiprism.fr" className="text-purple-400 hover:text-purple-300 underline">
              contact@partiprism.fr
            </a>
          </p>
        </article>

        {/* Article 5 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 5 — Propriété intellectuelle</h3>

          <h4 className="font-medium text-white mt-3 mb-1">5.1 — Contenus de la Plateforme</h4>
          <p>
            L'architecture, le design, le code source, les algorithmes et les bases de données
            sont protégés par le droit de la propriété intellectuelle et sont la propriété exclusive
            de l'éditeur.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">5.2 — Contenus générés par l'IA</h4>
          <p>
            Les contenus textuels générés par l'intelligence artificielle sont mis à disposition
            à titre informatif. L'éditeur ne revendique aucun droit d'auteur sur ces contenus.
          </p>

          <h4 className="font-medium text-white mt-4 mb-1">5.3 — Contributions des utilisateurs</h4>
          <p>
            L'utilisateur concède à l'éditeur un droit non exclusif, gratuit, mondial et illimité
            d'utiliser, d'agréger et de publier sous forme anonyme les données résultant de ses
            contributions, à des fins de synthèse collective et d'amélioration de la Plateforme.
          </p>
        </article>

        {/* Article 6 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 6 — Obligations des utilisateurs</h3>

          <h4 className="font-medium text-white mt-3 mb-1">6.1 — Utilisation loyale</h4>
          <p>L'utilisateur s'engage à utiliser la Plateforme de manière loyale et s'interdit notamment :</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-gray-400">
            <li>de manipuler les résultats collectifs par des réponses automatisées, répétées ou frauduleuses ;</li>
            <li>d'utiliser des robots, scripts, ou tout dispositif automatisé ;</li>
            <li>de tenter de désanonymiser les contributions d'autres utilisateurs ;</li>
            <li>de porter atteinte au fonctionnement technique de la Plateforme.</li>
          </ul>

          <h4 className="font-medium text-white mt-4 mb-1">6.2 — Interprétation des résultats</h4>
          <p>
            L'utilisateur reconnaît que les résultats sont des représentations schématiques à visée
            pédagogique et s'engage à ne pas les présenter comme des vérités absolues, des qualifications
            officielles ou des résultats de sondages d'opinion.
          </p>
        </article>

        {/* Article 7 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 7 — Liens hypertextes</h3>
          <p>
            La Plateforme peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun
            contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leur
            politique de confidentialité.
          </p>
        </article>

        {/* Article 8 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 8 — Modification des CGU</h3>
          <p>
            L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. L'utilisateur
            sera informé des modifications substantielles par un bandeau d'information. La poursuite
            de l'utilisation vaut acceptation des nouvelles conditions.
          </p>
        </article>

        {/* Article 9 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 9 — Droit applicable</h3>
          <p>
            Les présentes CGU sont régies par le droit français. Tout litige sera soumis aux
            tribunaux français compétents.
          </p>
        </article>

        {/* Article 10 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 10 — Contact et suggestions</h3>
          <p>
            La Plateforme est un projet collaboratif en amélioration continue. Toute suggestion
            ou signalement peut être adressé à :{' '}
            <a href="mailto:contact@partiprism.fr" className="text-purple-400 hover:text-purple-300 underline font-medium">
              contact@partiprism.fr
            </a>
          </p>
        </article>

        {/* Article 11 */}
        <article className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Article 11 — Mentions légales</h3>
          <p>
            Les mentions légales, incluant l'identification de l'éditeur et de l'hébergeur (LCEN),
            sont consultables sur la{' '}
            <button
              onClick={onNavigateMentions}
              className="text-purple-400 hover:text-purple-300 underline focus-ring rounded"
            >
              page dédiée
            </button>.
          </p>
        </article>

        {/* Clause finale */}
        <p className="text-xs text-gray-500 italic text-center pb-4">
          Les présentes CGU constituent l'intégralité de l'accord entre l'utilisateur et l'éditeur.
          Si une disposition était déclarée nulle, les autres dispositions resteraient en vigueur.
        </p>
      </div>
    </section>
  );
}
