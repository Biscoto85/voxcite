import type { CompassPosition } from '@voxcite/shared';
import type { AppScreen } from '@/App';

interface MainMenuProps {
  userPosition?: CompassPosition;
  onNavigate: (screen: AppScreen) => void;
}

const MENU_ITEMS: Array<{
  screen: AppScreen;
  title: string;
  description: string;
  icon: string;
  ready: boolean;
}> = [
  {
    screen: 'affiner',
    title: 'Affiner mon positionnement',
    description: 'Réponds à plus de questions pour préciser ton profil sur les 5 axes.',
    icon: '🎯',
    ready: true,
  },
  {
    screen: 'prisme',
    title: 'Le Prisme',
    description: 'Visualise ta position et celle des partis en 1D, 2D ou 3D.',
    icon: '🔮',
    ready: true,
  },
  {
    screen: 'analyse',
    title: 'Mon analyse',
    description: 'Découvre tes points communs et différences avec les partis et les autres citoyens.',
    icon: '📊',
    ready: true,
  },
  {
    screen: 'critique',
    title: 'Esprit critique',
    description: 'Confronte-toi à des faits vérifiés qui challengent tes convictions.',
    icon: '🧠',
    ready: false,
  },
  {
    screen: 'programme',
    title: 'Mon programme citoyen',
    description: 'Donne ton avis sur les grands thèmes pour construire le programme des Français.',
    icon: '📜',
    ready: false,
  },
];

export function MainMenu({ userPosition, onNavigate }: MainMenuProps) {
  return (
    <div className="max-w-lg mx-auto">
      {userPosition && (
        <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800 text-center">
          <p className="text-sm text-gray-400 mb-1">Ton profil est enregistré</p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span>Éco: {userPosition.economic > 0 ? '+' : ''}{userPosition.economic.toFixed(2)}</span>
            <span>Soc: {userPosition.societal > 0 ? '+' : ''}{userPosition.societal.toFixed(2)}</span>
            <span>Aut: {userPosition.authority > 0 ? '+' : ''}{userPosition.authority.toFixed(2)}</span>
            <span>Éco: {userPosition.ecology > 0 ? '+' : ''}{userPosition.ecology.toFixed(2)}</span>
            <span>Souv: {userPosition.sovereignty > 0 ? '+' : ''}{userPosition.sovereignty.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            disabled={!item.ready}
            className={`text-left p-4 rounded-xl border transition-all ${
              item.ready
                ? 'bg-gray-900 border-gray-800 hover:border-purple-600 hover:bg-gray-900/80'
                : 'bg-gray-900/50 border-gray-800/50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-medium">
                  {item.title}
                  {!item.ready && <span className="ml-2 text-xs text-gray-600">(bientôt)</span>}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
