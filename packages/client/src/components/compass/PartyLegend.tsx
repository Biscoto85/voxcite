import type { Party } from '@voxcite/shared';

interface PartyLegendProps {
  parties: Party[];
  visibleIds: Set<string>;
  highlightedId: string | null;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onHighlight: (id: string | null) => void;
}

export function PartyLegend({
  parties,
  visibleIds,
  highlightedId,
  onToggle,
  onToggleAll,
  onHighlight,
}: PartyLegendProps) {
  const allVisible = visibleIds.size === parties.length;

  // Sort by position1d (left to right)
  const sorted = [...parties].sort((a, b) => a.position1d - b.position1d);

  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Légende des partis">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Partis</span>
        <button
          onClick={onToggleAll}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors py-1 px-2 focus-ring rounded"
          aria-label={allVisible ? 'Masquer tous les partis' : 'Afficher tous les partis'}
        >
          {allVisible ? 'Masquer tout' : 'Afficher tout'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((p) => {
          const visible = visibleIds.has(p.id);
          const highlighted = highlightedId === p.id;

          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              onMouseEnter={() => onHighlight(p.id)}
              onMouseLeave={() => onHighlight(null)}
              aria-pressed={visible}
              aria-label={`${p.abbreviation} — ${visible ? 'visible' : 'masqué'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all focus-ring ${
                highlighted
                  ? 'ring-2 ring-white/50 scale-105'
                  : ''
              } ${
                visible
                  ? 'bg-gray-800 text-gray-200'
                  : 'bg-gray-900 text-gray-600'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: visible ? p.color : '#374151',
                }}
                aria-hidden="true"
              />
              {p.abbreviation}
            </button>
          );
        })}
      </div>
    </div>
  );
}
