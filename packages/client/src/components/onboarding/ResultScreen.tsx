import type { CompassPosition, Party } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';
import { getClosestParty, getQuadrantLabel } from '@/utils/scoring';

interface ResultScreenProps {
  position: CompassPosition;
  parties: Party[];
}

export function ResultScreen({ position, parties }: ResultScreenProps) {
  const closest = getClosestParty(position, parties);
  const quadrantLabel = getQuadrantLabel(position);

  const axes: Array<{ id: keyof CompassPosition; label: string }> = [
    { id: 'economic', label: `${AXES.economic.negative} ↔ ${AXES.economic.positive}` },
    { id: 'societal', label: `${AXES.societal.negative} ↔ ${AXES.societal.positive}` },
    { id: 'authority', label: `${AXES.authority.negative} ↔ ${AXES.authority.positive}` },
    { id: 'ecology', label: `${AXES.ecology.negative} ↔ ${AXES.ecology.positive}` },
    { id: 'sovereignty', label: `${AXES.sovereignty.negative} ↔ ${AXES.sovereignty.positive}` },
  ];

  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">Ton profil politique</h2>
      <p className="text-purple-400 text-lg mb-6">{quadrantLabel}</p>

      {/* Axis bars */}
      <div className="flex flex-col gap-3 mb-8">
        {axes.map(({ id, label }) => {
          const val = position[id];
          const pct = (val + 1) / 2 * 100;
          return (
            <div key={id}>
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>{label}</span>
                <span>{val > 0 ? '+' : ''}{val.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full relative">
                <div className="absolute left-1/2 top-0 w-px h-full bg-gray-600" />
                <div
                  className="absolute top-0 h-full bg-purple-600 rounded-full transition-all"
                  style={{
                    left: `${Math.min(pct, 50)}%`,
                    width: `${Math.abs(pct - 50)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {closest && (
        <p className="text-gray-400 mb-6">
          Parti le plus proche :
          <span className="ml-1 font-medium text-white" style={{ color: closest.color }}>
            {closest.label}
          </span>
        </p>
      )}

      <button
        onClick={() => {
          // Dispatch event for App to pick up
          window.dispatchEvent(new CustomEvent('onboarding-complete'));
        }}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
      >
        Voir le compas
      </button>
    </div>
  );
}
