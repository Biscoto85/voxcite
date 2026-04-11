interface MethodologieProps {
  onBack: () => void;
}

export function Methodologie({ onBack }: MethodologieProps) {
  return (
    <section className="max-w-2xl mx-auto" aria-label="Méthodologie">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Méthodologie</h2>
        <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">
          ← Retour
        </button>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">

        {/* Intro */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-base text-gray-200 leading-relaxed">
            Ce document explique comment PartiPrism calcule ton positionnement, comment les partis et les médias
            sont notés, et quelles sont les limites connues de notre approche.
          </p>
          <p className="mt-3 text-gray-400">
            Nous ne prétendons pas à l'objectivité totale — une telle objectivité n'existe pas dans ce domaine.
            Nous prétendons à la <strong className="text-gray-200">transparence</strong> et à la <strong className="text-gray-200">rigueur critique</strong>.
          </p>
        </div>

        {/* Les 5 axes */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Les 5 axes du compas</h3>
          <p className="mb-4">
            PartiPrism remplace l'axe unique gauche-droite par cinq dimensions indépendantes,
            chacune allant de <strong className="text-white">-1,0 à +1,0</strong>. Zéro signifie
            une position centriste ou neutre sur cet axe.
          </p>

          <div className="space-y-3">
            {[
              {
                label: 'Sociétal',
                neg: 'Conservateur',
                pos: 'Progressiste',
                why: 'Rapport aux mœurs, aux droits individuels, aux évolutions de société.',
                src: 'Norberto Bobbio, Droite et Gauche (1994)',
              },
              {
                label: 'Économique',
                neg: 'Interventionniste',
                pos: 'Libéral',
                why: "Rapport à l'État dans l'économie, au marché, à la redistribution.",
                src: 'Keynes (1936), Hayek (1944)',
              },
              {
                label: 'Autorité',
                neg: 'Autoritaire',
                pos: 'Libertaire',
                why: 'Rapport au pouvoir, au contrôle, aux libertés civiles.',
                src: 'Hobbes (1651), Proudhon (1840)',
              },
              {
                label: 'Écologie',
                neg: 'Productiviste',
                pos: 'Écologiste',
                why: 'Rapport à la croissance, aux limites planétaires, à la sobriété.',
                src: 'Club de Rome (1972), GIEC (1990-2023)',
              },
              {
                label: 'Souveraineté',
                neg: 'Souverainiste',
                pos: 'Mondialiste',
                why: "Rapport aux frontières, à la nation, aux institutions internationales.",
                src: 'Bodin (1576), Déclaration de Schuman (1950)',
              },
            ].map((ax) => (
              <div key={ax.label} className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-white">{ax.label}</span>
                  <span className="text-gray-600 text-xs">—</span>
                  <span className="text-red-400 text-xs">{ax.neg}</span>
                  <span className="text-gray-600 text-xs">↔</span>
                  <span className="text-green-400 text-xs">{ax.pos}</span>
                </div>
                <p className="text-xs text-gray-400">{ax.why}</p>
                <p className="text-xs text-gray-600 mt-0.5">Ref. : {ax.src}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            <strong className="text-gray-400">Pourquoi ces 5 axes ?</strong> Les axes sociétal et économique
            forment le compas politique classique (Political Compass). L'autorité distingue un conservateur
            libertarien d'un conservateur autoritaire — distinction que l'axe gauche-droite ne fait pas.
            L'écologie est devenu un clivage structurant qui divise y compris la gauche. La souveraineté
            révèle une fracture peuple/élite que LFI et le RN partagent pour des raisons opposées.
          </p>
        </div>

        {/* Questions et scoring */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Les questions et le calcul du score</h3>

          <p className="mb-3">
            L'onboarding comporte <strong className="text-white">15 questions</strong> — exactement 3 par axe.
            Elles produisent un premier positionnement. Le module <em>Affiner</em> propose ensuite
            54 questions d'approfondissement thématique pour plus de précision.
          </p>

          <p className="mb-3">
            Chaque question a une <strong className="text-white">polarité</strong> (+1 ou -1) :
            elle indique si répondre positivement pousse vers le pôle positif ou négatif de l'axe.
            Certaines questions mesurent plusieurs axes simultanément.
          </p>

          <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50 mb-3 font-mono text-xs">
            <p className="text-gray-400 mb-1">// Formule de calcul</p>
            <p className="text-amber-300">intensité = |réponse| / 2 <span className="text-gray-500">// 0,0 à 1,0</span></p>
            <p className="text-amber-300">boost = 0,70 + 0,30 × intensité <span className="text-gray-500">// 0,70 à 1,00</span></p>
            <p className="text-amber-300">contribution = réponse × polarité × poids × boost</p>
            <p className="text-gray-400 mt-1">score_axe = Σ contributions / Σ poids_max <span className="text-gray-500">// clampé [-1, +1]</span></p>
          </div>

          <p className="text-xs text-gray-400">
            Le <strong className="text-gray-300">boost d'intensité</strong> signifie qu'une réponse
            "tout à fait d'accord" (±2) pèse relativement plus qu'une réponse "d'accord" (±1).
            Une conviction forte influence davantage le positionnement qu'une opinion nuancée.
            Ce mécanisme est intentionnel : il reflète l'idée que l'intensité d'un accord
            est une information en elle-même.
          </p>

          <p className="mt-3 text-xs text-gray-400">
            Certaines questions ont un <strong className="text-gray-300">poids renforcé</strong> (1,5 au lieu
            de 1,0) quand elles sont particulièrement discriminantes — c'est-à-dire quand elles séparent
            clairement des profils politiques distincts sans ambiguïté de formulation.
          </p>
        </div>

        {/* Partis */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Le positionnement des partis</h3>

          <p className="mb-3">
            Les positions des partis sont des <strong className="text-white">estimations éditoriales</strong>,
            pas des faits scientifiques. Elles sont établies à partir de quatre sources :
          </p>

          <ol className="space-y-2 list-none mb-4">
            {[
              ['Le programme officiel', 'le document publié pour les dernières élections. Source primaire.'],
              ['Les votes parlementaires', 'les scrutins publics sur les textes structurants (budget, sécurité, écologie, immigration, traités). Les votes sont un fait, pas une interprétation.'],
              ['Les prises de position publiques', 'les déclarations des leaders sur les sujets clivants, en excluant la communication de circonstance.'],
              ['Les alliances et coalitions', 'avec qui un parti gouverne, vote ou s\'allie révèle ses priorités réelles.'],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                <span><strong className="text-gray-200">{title}</strong> — {desc}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-lg bg-gray-800/60 p-3 border border-gray-700/50 mb-3">
            <p className="text-xs text-gray-400 mb-2 font-medium text-gray-300">Exemple : La France Insoumise</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-400">Sociétal</span><span className="text-white">+0,70 (progressiste) — droits, antiracisme, axe fort</span>
              <span className="text-gray-400">Économique</span><span className="text-white">-0,80 (interventionniste) — planification, SMIC, retraites</span>
              <span className="text-gray-400">Autorité</span><span className="text-white">+0,30 (modéré) — libertés civiles oui, mais structure verticale</span>
              <span className="text-gray-400">Écologie</span><span className="text-white">+0,60 (écologiste) — planification écologique, mais pro-nucléaire</span>
              <span className="text-gray-400">Souveraineté</span><span className="text-white">-0,40 (souverainiste) — désobéissance UE, mais internationaliste</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Ces positions ne mesurent ni l'opinion des électeurs, ni la diversité interne des partis,
            ni les évolutions récentes non encore traduites en programme ou en votes.
          </p>
        </div>

        {/* Médias */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Le positionnement des médias</h3>

          <p className="mb-3">
            Chaque média est positionné sur les 5 axes à partir de sa ligne éditoriale déclarée,
            de ses choix de sujets et d'invités, et du traitement des sujets clivants.
            La structure de propriété est documentée mais n'est pas utilisée directement pour la notation.
          </p>

          <p className="mb-3">
            La position affichée est un mélange pondéré :
          </p>

          <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50 mb-3">
            <p className="text-center font-mono text-sm">
              <span className="text-amber-400">70%</span>
              <span className="text-gray-500"> position éditoriale initiale + </span>
              <span className="text-cyan-400">30%</span>
              <span className="text-gray-500"> perception citoyenne</span>
            </p>
          </div>

          <p className="mb-2 text-xs text-gray-400">
            Les visiteurs peuvent évaluer chaque média sur 2 axes (sociétal et économique).
            La pondération 70/30 protège contre le brigading — un groupe organisé ne peut pas
            faire dériver un score de plus de 0,3 unité, même avec des centaines de votes coordonnés.
          </p>

          <p className="text-xs text-gray-500">
            Cas particulier : les réseaux sociaux sont positionnés à 0,0 sur tous les axes.
            Leur biais n'est pas éditorial mais algorithmique — ils amplifient les positions existantes
            de l'utilisateur via la personnalisation.
          </p>
        </div>

        {/* IA */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">L'analyse par intelligence artificielle</h3>

          <p className="mb-3">
            L'écran <em>Mon analyse</em> utilise le modèle <strong className="text-white">Claude Haiku</strong> (Anthropic)
            pour générer un résumé de profil, une comparaison avec la population et les partis,
            et une liste de biais potentiels. Une analyse approfondie est disponible avec le modèle
            <strong className="text-white"> Claude Sonnet</strong> pour les utilisateurs qui ont partagé
            l'application à plusieurs contacts.
          </p>

          <p className="mb-3 text-xs text-amber-400/80">
            L'analyse IA est un <strong>outil d'éclairage</strong>, pas un verdict. Elle interprète des données
            numériques (5 scores entre -1 et +1) à travers un prompt structuré. Ses formulations sont
            celles d'une IA — elles peuvent être approximatives, génériques, ou partiellement inexactes.
          </p>

          <p className="text-xs text-gray-500">
            L'analyse est générée côté serveur, éphémère (rien n'est stocké), et mise en cache
            localement dans ton navigateur. Elle ne contient aucun identifiant et n'est pas transmise
            à des tiers. Les résultats sont différents selon le nombre de questions répondues.
          </p>
        </div>

        {/* Données */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Les données collectées</h3>

          <p className="mb-3">
            Le calcul de ton positionnement s'effectue <strong className="text-white">entièrement dans ton navigateur</strong>.
            Le serveur ne reçoit jamais tes réponses individuelles, ni ton positionnement en temps réel.
          </p>

          <p className="mb-3">
            À la fin de l'onboarding, un <strong className="text-white">snapshot anonyme</strong> est envoyé
            pour alimenter la nébuleuse collective. Il contient :
          </p>

          <ul className="space-y-1 text-xs text-gray-400 mb-3 list-none">
            {[
              'Ta position sur les 5 axes (5 nombres)',
              'Ton code postal (département uniquement pour les statistiques géographiques)',
              'Tes formats d\'information déclarés (TV, radio, presse, podcasts…)',
              'Ton rapport aux médias (confiance, recul critique, indépendance…)',
              'Ton orientation perçue de tes sources (gauche, droite, variée…)',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400 shrink-0">·</span>{item}
              </li>
            ))}
          </ul>

          <p className="text-xs text-gray-500">
            Aucun de ces champs n'est nominatif. Il n'y a pas de compte utilisateur, pas de session serveur,
            pas d'adresse IP stockée, pas de cookie de suivi. Ces données constituent des
            <em> données vraiment anonymes</em> au sens du considérant 26 du RGPD.
          </p>
        </div>

        {/* Limites */}
        <div className="bg-gray-900 rounded-xl p-5 border border-amber-900/20 border">
          <h3 className="text-base font-semibold text-white mb-3">Les limites que nous assumons</h3>

          <div className="space-y-3">
            {[
              ['Biais du concepteur', 'Les scores initiaux des partis et des médias ont été estimés par le modèle Claude Sonnet 4.6 (Anthropic), sollicité sans instruction susceptible d\'orienter ses réponses. Les prompts utilisés n\'ont pas tous été archivés, mais l\'éditeur s\'attend à ce qu\'ils soient reproductibles. Tout écart significatif peut être signalé à partiprism@proton.me et sera examiné par le bureau en assemblée ordinaire ; une correction sera apportée dès que possible si l\'écart avec un avis neutre de l\'IA est avéré.'],
              ['Biais de réduction', '5 axes ne capturent pas tout. Le rapport au progrès technique, à la religion, à l\'histoire — ces dimensions sont partiellement présentes mais pas pleinement. Aucun compas politique ne peut être exhaustif.'],
              ['Biais de fixité', 'Les positions sont des instantanés. Un parti peut changer de ligne rapidement (ex : le RN sur l\'économie entre 2017 et 2024). Des mises à jour régulières sont nécessaires.'],
              ['Biais de représentation', 'Les utilisateurs de PartiPrism ne sont pas un échantillon représentatif de la population française. Les statistiques collectives reflètent la communauté de l\'app, pas un sondage.'],
            ].map(([title, desc], i) => (
              <div key={i}>
                <p className="font-medium text-amber-300/80 text-xs uppercase tracking-wide mb-1">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contribuer */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Contribuer à améliorer</h3>

          <p className="mb-3">
            La méthodologie est <strong className="text-white">publique et critiquable</strong>.
            Si tu penses qu'un positionnement est incorrect :
          </p>

          <ul className="space-y-2 list-none text-xs">
            {[
              ['Bouton feedback', 'disponible sur tous les écrans — signale un biais ou une erreur de positionnement. Un feedback sourcé ("Le Figaro n\'est pas à -0,3 sur le sociétal, voici pourquoi") est infiniment plus utile qu\'un simple désaccord.'],
              ['Évaluation des médias', 'dans l\'onglet Esprit critique — contribue à la perception citoyenne sur les axes sociétal et économique.'],
              ['Proposition de médias', 'si un média de qualité n\'est pas dans notre liste référencée, propose-le via le formulaire "Média manquant".'],
              ['Contact direct', 'partiprism@proton.me pour les signalements complexes ou les contestations argumentées.'],
            ].map(([action, desc], i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400 shrink-0 font-medium">→</span>
                <span><strong className="text-gray-200">{action}</strong> — {desc}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-gray-600 text-right">
            Document versionné — dernière mise à jour : avril 2026
          </p>
        </div>

      </div>
    </section>
  );
}
