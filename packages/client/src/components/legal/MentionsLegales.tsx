interface MentionsLegalesProps {
  onBack: () => void;
  onNavigateCGU: () => void;
}

export function MentionsLegales({ onBack, onNavigateCGU }: MentionsLegalesProps) {
  return (
    <section className="max-w-2xl mx-auto" aria-label="Mentions légales">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Mentions légales</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300 focus-ring rounded py-1 px-2">
          ← Retour
        </button>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        {/* Éditeur */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Éditeur du site</h3>
          <p>
            Le site <strong className="text-white">partiprism.fr</strong> est édité par l'association loi 1901 :
          </p>
          <ul className="mt-3 space-y-1.5 list-none">
            <li><span className="text-gray-500">Nom :</span> <strong className="text-white">Association Parti Prism</strong></li>
            <li><span className="text-gray-500">Président :</span> Parti Prism</li>
            <li><span className="text-gray-500">Siège social :</span> France</li>
            <li><span className="text-gray-500">Contact :</span>{' '}
              <a href="mailto:contact@partiprism.fr" className="text-purple-400 hover:text-purple-300 underline">
                contact@partiprism.fr
              </a>
            </li>
          </ul>
        </div>

        {/* Directeur de la publication */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Directeur de la publication</h3>
          <p>Le directeur de la publication est le Président de l'association Parti Prism.</p>
          <p className="text-gray-500 text-xs mt-2">
            Conformément à l'article 6-III-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).
          </p>
        </div>

        {/* Hébergeur */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Hébergement</h3>
          <p>Le site est hébergé par :</p>
          <ul className="mt-3 space-y-1.5 list-none">
            <li><span className="text-gray-500">Hébergeur :</span> Serveur VPS privé</li>
            <li><span className="text-gray-500">Localisation :</span> France / Union européenne</li>
          </ul>
        </div>

        {/* Propriété intellectuelle */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Propriété intellectuelle</h3>
          <p>
            L'ensemble du contenu du site (architecture, code source, design, bases de données)
            est protégé par le droit de la propriété intellectuelle et est la propriété exclusive
            de l'association Parti Prism, sauf mention contraire.
          </p>
          <p className="mt-2">
            Les contenus textuels générés par les systèmes d'intelligence artificielle sont mis à
            disposition à titre informatif et pédagogique. L'éditeur ne revendique aucun droit d'auteur
            sur ces contenus.
          </p>
        </div>

        {/* Données personnelles */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Données personnelles</h3>
          <p>
            Le site ne collecte aucune donnée d'identification personnelle. Seules sont collectées
            les réponses anonymes aux questions de positionnement et un identifiant de session technique
            non rattachable à une identité.
          </p>
          <p className="mt-2">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            d'un droit d'accès, de rectification et d'effacement de vos données.
            Contact :{' '}
            <a href="mailto:contact@partiprism.fr" className="text-purple-400 hover:text-purple-300 underline">
              contact@partiprism.fr
            </a>
          </p>
          <p className="mt-2">
            Vous pouvez également introduire une réclamation auprès de la{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              CNIL
            </a>.
          </p>
        </div>

        {/* Lien vers CGU */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Conditions d'utilisation</h3>
          <p>
            L'utilisation du site est soumise aux{' '}
            <button
              onClick={onNavigateCGU}
              className="text-purple-400 hover:text-purple-300 underline focus-ring rounded"
            >
              Conditions Générales d'Utilisation
            </button>.
          </p>
        </div>

        {/* Crédits */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-base font-semibold text-white mb-3">Crédits</h3>
          <ul className="space-y-1.5 list-none">
            <li><span className="text-gray-500">Framework :</span> React, Vite, Tailwind CSS</li>
            <li><span className="text-gray-500">IA :</span> Claude (Anthropic)</li>
            <li><span className="text-gray-500">Infrastructure :</span> Node.js, PostgreSQL, Nginx</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
