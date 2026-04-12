import { useState, useEffect, useCallback } from 'react';
import type { CompassPosition, Party } from '@partiprism/shared';
import type { AppScreen } from '@/App';
import { getProfileLabel } from '@/utils/scoring';

const LS_VISITED = 'partiprism_visited_screens';

function getVisited(): Set<AppScreen> {
  try {
    const raw = localStorage.getItem(LS_VISITED);
    return raw ? new Set(JSON.parse(raw) as AppScreen[]) : new Set();
  } catch { return new Set(); }
}

function markVisited(screen: AppScreen) {
  try {
    const visited = getVisited();
    visited.add(screen);
    localStorage.setItem(LS_VISITED, JSON.stringify([...visited]));
  } catch { /* ignore */ }
}

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
    screen: 'situer',
    title: 'Me situer',
    description: 'Analyse ton profil politique, compare-toi aux partis et aux autres citoyens.',
    icon: '⬡',
    iconColor: 'text-amber-300',
    ready: true,
  },
  {
    screen: 'critique',
    title: 'Esprit critique',
    description: 'Explore tes biais informationnels et découvre des sources qui élargissent ton horizon.',
    icon: '◇',
    iconColor: 'text-cyan-300',
    ready: true,
  },
  {
    screen: 'prisme',
    title: 'Prisme',
    description: 'Visualise ta position sur les 5 axes et compare-la à celle des partis.',
    icon: '△',
    iconColor: 'text-cyan-400',
    ready: true,
  },
  {
    screen: 'affiner',
    title: 'Affiner',
    description: 'Réponds à plus de questions pour préciser ton profil politique.',
    icon: '◎',
    iconColor: 'text-amber-400',
    ready: true,
  },
  {
    screen: 'exprimer',
    title: 'M\'exprimer',
    description: 'Partage tes idées et contribue à l\'élaboration de propositions citoyennes structurées.',
    icon: '▷',
    iconColor: 'text-amber-400',
    ready: true,
  },
  {
    screen: 'mobiliser',
    title: 'Me mobiliser',
    description: 'Découvre des initiatives citoyennes non-partisanes et reste informé·e.',
    icon: '◉',
    iconColor: 'text-green-400',
    ready: true,
  },
];

// Suggestion contextuelle selon l'avancement du parcours
function getSuggestion(visited: Set<AppScreen>): string | null {
  if (!visited.has('situer')) return 'Commence par découvrir ton analyse complète →';
  if (!visited.has('critique')) return 'Explore maintenant tes biais informationnels →';
  return null;
}

export function MainMenu({ userPosition, parties, onNavigate }: MainMenuProps) {
  const [visited, setVisited] = useState<Set<AppScreen>>(() => getVisited());

  // Refresh visited state on each menu visit
  useEffect(() => { setVisited(getVisited()); }, []);

  const handleNavigate = useCallback((screen: AppScreen) => {
    markVisited(screen);
    setVisited(getVisited());
    onNavigate(screen);
  }, [onNavigate]);

  const suggestion = getSuggestion(visited);
  const isFirstVisit = !visited.has('situer');

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

      {/* Suggestion contextuelle — disparaît quand les 2 étapes clés sont vues */}
      {suggestion && (
        <div className="mb-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-sm text-amber-300">
          <span aria-hidden="true">→</span>
          <span>{suggestion}</span>
        </div>
      )}

      <nav aria-label="Menu principal">
        <ul className="flex flex-col gap-3" role="list">
          {MENU_ITEMS.map((item) => {
            const isRecommended = isFirstVisit && item.screen === 'situer';
            const isVisited = visited.has(item.screen);
            return (
              <li key={item.screen}>
                <button
                  onClick={() => handleNavigate(item.screen)}
                  disabled={!item.ready}
                  aria-label={`${item.title} — ${item.description}`}
                  className={`w-full text-left p-4 rounded-xl border transition-all touch-target focus-ring ${
                    item.ready
                      ? isRecommended
                        ? 'bg-amber-500/10 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/15'
                        : 'bg-gray-900 border-gray-800 hover:border-amber-500 hover:bg-gray-900/80'
                      : 'bg-gray-900/50 border-gray-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-2xl ${item.iconColor}`} aria-hidden="true">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">
                          {item.title}
                          {!item.ready && <span className="ml-2 text-xs text-gray-600">(bientôt)</span>}
                        </h3>
                        {isRecommended && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-medium">
                            Commencer ici
                          </span>
                        )}
                        {isVisited && !isRecommended && (
                          <span className="text-[10px] text-gray-600" aria-label="Déjà visité">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
