import { useState } from 'react';
import type { Party, AxisId, CompassPosition } from '@partiprism/shared';
import { AXES, SUGGESTED_VIEWS } from '@partiprism/shared';
import { CompassCanvas1D } from './CompassCanvas1D';
import { CompassCanvas2D } from './CompassCanvas2D';
import { CompassCanvas3D } from './CompassCanvas3D';
import { AxisSelector } from './AxisSelector';
import { PartyLegend } from './PartyLegend';

export type CompassView = '1d' | '2d' | '3d';

interface CompassContainerProps {
  parties: Party[];
  userPosition?: CompassPosition;
  initialView?: CompassView;
  onBack?: () => void;
}

export function CompassContainer({ parties, userPosition, initialView = '2d', onBack }: CompassContainerProps) {
  const [view, setView] = useState<CompassView>(initialView);
  const [xAxis, setXAxis] = useState<AxisId>('societal');
  const [yAxis, setYAxis] = useState<AxisId>('economic');
  const [zAxis, setZAxis] = useState<AxisId>('authority');
  const [visiblePartyIds, setVisiblePartyIds] = useState<Set<string>>(
    new Set(parties.map((p) => p.id)),
  );
  const [highlightedPartyId, setHighlightedPartyId] = useState<string | null>(null);

  const visibleParties = parties.filter((p) => visiblePartyIds.has(p.id));

  const toggleParty = (id: string) => {
    setVisiblePartyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (visiblePartyIds.size === parties.length) {
      setVisiblePartyIds(new Set());
    } else {
      setVisiblePartyIds(new Set(parties.map((p) => p.id)));
    }
  };

  return (
    <section className="flex flex-col gap-4 w-full max-w-4xl mx-auto" aria-label="Compas politique">
      {/* Header with back button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Prisme</h2>
          <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">← Menu</button>
        </div>
      )}

      {/* View tabs + axis selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2" role="tablist" aria-label="Dimension du compas">
          {(['1d', '2d', '3d'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              role="tab"
              aria-selected={view === v}
              aria-controls={`compass-panel-${v}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target focus-ring ${
                view === v
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        {view !== '1d' && (
          <div className="sm:ml-4 sm:flex-1">
            <AxisSelector
              view={view}
              xAxis={xAxis}
              yAxis={yAxis}
              zAxis={zAxis}
              onXChange={setXAxis}
              onYChange={setYAxis}
              onZChange={setZAxis}
            />
          </div>
        )}
      </div>

      {/* Preset views (2D only) */}
      {view === '2d' && (
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Vues prédéfinies">
          {SUGGESTED_VIEWS.map((sv) => (
            <button
              key={sv.label}
              onClick={() => { setXAxis(sv.x); setYAxis(sv.y); }}
              className={`px-3 py-1.5 rounded text-xs transition-colors focus-ring ${
                xAxis === sv.x && yAxis === sv.y
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {sv.label}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        className="relative bg-gray-900 rounded-xl overflow-hidden"
        style={{ minHeight: 'min(60vh, 500px)' }}
        role="img"
        aria-label={`Compas politique ${view.toUpperCase()} — ${visibleParties.length} partis affichés`}
        id={`compass-panel-${view}`}
      >
        {view === '1d' && (
          <CompassCanvas1D
            parties={visibleParties}
            userPosition={userPosition}
            highlightedPartyId={highlightedPartyId}
            onPartyHover={setHighlightedPartyId}
          />
        )}
        {view === '2d' && (
          <CompassCanvas2D
            parties={visibleParties}
            userPosition={userPosition}
            xAxis={xAxis}
            yAxis={yAxis}
            highlightedPartyId={highlightedPartyId}
            onPartyHover={setHighlightedPartyId}
          />
        )}
        {view === '3d' && (
          <CompassCanvas3D
            parties={visibleParties}
            userPosition={userPosition}
            xAxis={xAxis}
            yAxis={yAxis}
            zAxis={zAxis}
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
        onToggle={toggleParty}
        onToggleAll={toggleAll}
        onHighlight={setHighlightedPartyId}
      />
    </section>
  );
}
