import { useState } from 'react';
import type { Party, AxisId, CompassPosition } from '@voxcite/shared';
import { AXES, SUGGESTED_VIEWS } from '@voxcite/shared';
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
}

export function CompassContainer({ parties, userPosition, initialView = '2d' }: CompassContainerProps) {
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
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* View tabs */}
      <div className="flex items-center gap-2">
        {(['1d', '2d', '3d'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {v.toUpperCase()}
          </button>
        ))}

        {view !== '1d' && (
          <div className="ml-4 flex-1">
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

      {/* Preset views (2D/3D only) */}
      {view === '2d' && (
        <div className="flex gap-2 flex-wrap">
          {SUGGESTED_VIEWS.map((sv) => (
            <button
              key={sv.label}
              onClick={() => { setXAxis(sv.x); setYAxis(sv.y); }}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                xAxis === sv.x && yAxis === sv.y
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {sv.label}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ minHeight: 400 }}>
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
    </div>
  );
}
