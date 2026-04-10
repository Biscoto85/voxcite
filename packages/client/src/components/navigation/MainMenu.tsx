import { useState } from 'react';
import type { CompassPosition, Party } from '@partiprism/shared';
import type { AppScreen } from '@/App';
import { getProfileLabel } from '@/utils/scoring';
import { SharePanel } from '@/components/share/SharePanel';

interface MainMenuProps {
  userPosition?: CompassPosition;
  parties: Party[];
  onNavigate: (screen: AppScreen) => void;
}

const MENU_ITEMS: Array<{
  screen: AppScreen;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  ready: boolean;
}> = [
  {
    screen: 'affiner',
    title: 'Affiner',
    description: 'Réponds à plus de questions pour préciser ton profil.',
    icon: '◎',
    iconColor: 'text-amber-400',
    ready: true,
  },
  {
    screen: 'prisme',
    title: 'Prisme',
    description: 'Visualise ta position et celle des partis.',
    icon: '△',
    iconColor: 'text-cyan-400',
    ready: true,
  },
  {
    screen: 'comparaison',
    title: 'Comparaison',
    description: 'Découvre tes points communs et différences avec les partis et les autres citoyens.',
    icon: '⬡',
    iconColor: 'text-amber-300',
    ready: true,
  },
  {
    screen: 'critique',
    title: 'Esprit critique',
    description: 'Des infos et sources intéressantes pour élargir ton horizon.',
    icon: '◇',
    iconColor: 'text-cyan-300',
    ready: true,
  },
  {
    screen: 'exprimer',
    title: 'M\'exprimer',
    description: 'Donne ton avis sur les grands thèmes et contribue au programme des citoyens.',
    icon: '▷',
    iconColor: 'text-amber-400',
    ready: true,
  },
];

export function MainMenu({ userPosition, parties, onNavigate }: MainMenuProps) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="max-w-lg mx-auto">
      {userPosition && (
        <section
          className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800 text-center"
          aria-label="Ton profil"
        >
          <p className="text-sm text-gray-400 mb-1">Ton parti pris'm :</p>
          <p className="text-lg font-semibold text-amber-300">
            {getProfileLabel(userPosition)}
          </p>
        </section>
      )}

      <nav aria-label="Menu principal">
        <ul className="flex flex-col gap-3" role="list">
          {MENU_ITEMS.map((item) => (
            <li key={item.screen}>
              <button
                onClick={() => onNavigate(item.screen)}
                disabled={!item.ready}
                aria-label={`${item.title} — ${item.description}`}
                className={`w-full text-left p-4 rounded-xl border transition-all touch-target focus-ring ${
                  item.ready
                    ? 'bg-gray-900 border-gray-800 hover:border-amber-500 hover:bg-gray-900/80'
                    : 'bg-gray-900/50 border-gray-800/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${item.iconColor}`} aria-hidden="true">{item.icon}</span>
                  <div>
                    <h3 className="font-medium">
                      {item.title}
                      {!item.ready && <span className="ml-2 text-xs text-gray-600">(bientôt)</span>}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Share section */}
      {userPosition && (
        <div className="mt-4">
          <button
            onClick={() => setShowShare((v) => !v)}
            className={`w-full p-4 rounded-xl border transition-all touch-target focus-ring text-left ${
              showShare
                ? 'bg-amber-950/30 border-amber-800/50'
                : 'bg-gray-900 border-gray-800 hover:border-amber-500 hover:bg-gray-900/80'
            }`}
            aria-expanded={showShare}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl text-amber-400" aria-hidden="true">↗</span>
              <div className="flex-1">
                <h3 className="font-medium">Partager PartiPrism</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Invite tes proches à découvrir leur positionnement.
                </p>
              </div>
              <span className="text-gray-500 text-sm" aria-hidden="true">
                {showShare ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {showShare && (
            <div className="mt-3 bg-gray-900 rounded-xl p-4 border border-amber-900/30">
              <SharePanel userPosition={userPosition} parties={parties} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
