import { useState, useEffect } from 'react';
import type { Party, CompassPosition } from '@partiprism/shared';
import { CompassCanvas1D } from './CompassCanvas1D';
import { CompassCanvas2D } from './CompassCanvas2D';
import { PartyLegend } from './PartyLegend';
import { getClosestParty } from '@/utils/scoring';

interface CompassRevealProps {
  parties: Party[];
  userPosition: CompassPosition;
  onContinue: () => void;
}

export function CompassReveal({ parties, userPosition, onContinue }: CompassRevealProps) {
  const [phase, setPhase] = useState<'1d' | 'transition' | '2d'>('1d');
  const [opacity1D, setOpacity1D] = useState(1);
  const [opacity2D, setOpacity2D] = useState(0);
  const closest = getClosestParty(userPosition, parties);

  const [highlightedPartyId, setHighlightedPartyId] = useState<string | null>(null);
  const visiblePartyIds = new Set(parties.map((p) => p.id));

  // Auto-transition: 1D (3s) → crossfade (0.8s) → 2D
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('transition');
      setOpacity2D(0);
      requestAnimationFrame(() => {
        setOpacity1D(0);
        setOpacity2D(1);
      });
    }, 3000);

    const t2 = setTimeout(() => {
      setPhase('2d');
    }, 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="max-w-4xl mx-auto flex flex-col gap-4" aria-label="Révélation du positionnement">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-1">Ton positionnement</h2>
        {closest && (
          <p className="text-gray-400 text-sm">
            Parti le plus proche :
            <span className="ml-1 font-medium" style={{ color: closest.color }}>
              {closest.label}
            </span>
          </p>
        )}
      </div>

      {/* Canvas area */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        {/* 1D phase: fixed height for the 1D bar */}
        {phase === '1d' && (
          <CompassCanvas1D
            parties={parties}
            userPosition={userPosition}
            highlightedPartyId={highlightedPartyId}
            onPartyHover={setHighlightedPartyId}
          />
        )}

        {/* Crossfade: both canvases stacked with opacity */}
        {phase === 'transition' && (
          <div className="relative" style={{ minHeight: 400 }}>
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: opacity1D }}
            >
              <CompassCanvas1D
                parties={parties}
                userPosition={userPosition}
                highlightedPartyId={highlightedPartyId}
                onPartyHover={setHighlightedPartyId}
              />
            </div>
            <div
              className="transition-opacity duration-700"
              style={{ opacity: opacity2D }}
            >
              <CompassCanvas2D
                parties={parties}
                userPosition={userPosition}
                xAxis="societal"
                yAxis="economic"
                highlightedPartyId={highlightedPartyId}
                onPartyHover={setHighlightedPartyId}
              />
            </div>
          </div>
        )}

        {/* 2D phase: canvas takes its natural height, no overflow */}
        {phase === '2d' && (
          <CompassCanvas2D
            parties={parties}
            userPosition={userPosition}
            xAxis="societal"
            yAxis="economic"
            highlightedPartyId={highlightedPartyId}
            onPartyHover={setHighlightedPartyId}
          />
        )}
      </div>

      {/* Legend */}
      <PartyLegend
        parties={parties}
        visibleIds={visiblePartyIds}
        highlightedId={highlightedPartyId}
        onToggle={() => {}}
        onToggleAll={() => {}}
        onHighlight={setHighlightedPartyId}
      />

      {/* Hint + Continue */}
      <div className="text-center pb-4">
        {phase === '1d' && (
          <p className="text-xs text-gray-500 animate-pulse" aria-live="polite">L'axe gauche-droite ne dit pas tout...</p>
        )}
        {phase !== '1d' && (
          <p className="text-xs text-gray-500 mb-3">Axe sociétal × économique — ton vrai positionnement</p>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 rounded-lg font-medium transition-colors touch-target focus-ring"
        >
          Continuer
        </button>
      </div>
    </section>
  );
}
