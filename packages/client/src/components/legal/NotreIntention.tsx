interface NotreIntentionProps {
  onBack: () => void;
}

export function NotreIntention({ onBack }: NotreIntentionProps) {
  return (
    <section className="max-w-2xl mx-auto" aria-label="Notre intention">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Notre intention</h2>
        <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">
          ← Retour
        </button>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-base text-gray-200 leading-relaxed">
            La politique française se résume souvent à une ligne. À gauche, à droite — et entre les deux,
            un vaste espace où se perdent des millions de convictions qui ne ressemblent à aucune étiquette.
          </p>
          <p className="mt-3 text-gray-400">
            Ce n'est pas un hasard. C'est la conséquence d'un outil de mesure inadapté.
          </p>
        </div>

        {/* Section 1 */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Un compas à un axe ne suffit pas</h3>
          <p>
            Les grands débats de notre époque — le rapport à l'autorité, à la liberté individuelle, aux frontières,
            à l'écologie, à la mondialisation — ne se laissent pas réduire à une opposition droite-gauche héritée
            du XIXe siècle. Forcer cinq dimensions de pensée sur une seule ligne, c'est inévitablement effacer
            des nuances, créer des alliances artificielles, et disqualifier des positions légitimes.
          </p>
          <p className="mt-3 text-amber-400/80">
            PartiPrism part d'une hypothèse simple : si l'on se donne la peine de mesurer correctement,
            beaucoup de gens se découvrent plus complexes qu'ils ne le pensaient — et moins bien représentés
            qu'ils ne le méritent.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Les orphelins politiques sont peut-être la majorité</h3>
          <p>
            Il existe des millions de citoyens qui ne se reconnaissent vraiment dans aucun parti. Pas par apathie —
            souvent par excès de lucidité. Leurs positions ne correspondent à aucune case disponible. Ils votent
            parfois pour le moins pire, s'abstiennent souvent, et finissent par s'éloigner d'un débat public
            qui ne leur ressemble pas.
          </p>
          <p className="mt-3">
            Nous pensons que ces personnes ne sont pas le problème de la démocratie. Elles en sont la ressource inexploitée.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">L'information, c'est aussi une question de posture</h3>
          <p>
            La qualité d'une opinion dépend en partie de la qualité de l'information qui l'a nourrie. S'exposer
            uniquement à des sources qui confirment ce que l'on pense déjà ne rend pas plus certain — cela rend
            plus fragile.
          </p>
          <p className="mt-3">
            Nous ne prônons pas la neutralité, qui n'existe pas. Nous défendons la curiosité : lire ce avec quoi
            on n'est pas d'accord, non pas pour changer d'avis, mais pour comprendre pourquoi d'autres personnes
            raisonnables arrivent à des conclusions différentes des nôtres. C'est ainsi que la pensée s'affine.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Une démocratie vivante se nourrit de citoyens mobilisés</h3>
          <p>
            Nous croyons que le système politique évolue quand les citoyens s'y intéressent vraiment — quand
            ils se positionnent, débattent, exigent et participent. La désaffection citoyenne n'est pas une fatalité :
            c'est le résultat d'un sentiment d'impuissance que rien n'oblige à accepter.
          </p>
          <p className="mt-3">
            Les outils numériques permettent aujourd'hui de recueillir, structurer et rendre visibles des convictions
            communes. Pas pour les transformer mécaniquement en programme — mais pour que les citoyens qui partagent
            des positions puissent les formuler, les préciser, et les porter plus clairement dans le débat public.
            C'est à cette ambition modeste mais sérieuse que s'essaie PartiPrism.
          </p>
        </div>

        {/* Section 5 — Ce que nous sommes */}
        <div className="bg-gray-900 rounded-xl p-5 border border-amber-900/30">
          <h3 className="text-base font-semibold text-white mb-3">Ce que nous sommes — et ce que nous ne sommes pas</h3>
          <p>
            PartiPrism n'est affilié à aucun parti, aucun mouvement, aucun financeur politique. Nous n'avons pas
            de programme à défendre ni de candidat à promouvoir. Le code de l'application est ouvert, la méthodologie
            des questions est documentée et discutable.
          </p>
          <p className="mt-3 text-amber-400/80 font-medium">
            Notre seule conviction : une démocratie en meilleure santé commence par des citoyens mieux informés
            de leur propre positionnement — et de celui des autres.
          </p>
        </div>

      </div>
    </section>
  );
}
