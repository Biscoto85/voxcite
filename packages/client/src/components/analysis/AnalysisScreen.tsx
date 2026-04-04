import { useState, useEffect } from 'react';
import type { CompassPosition, Party, AxisId } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';

interface AnalysisScreenProps {
  position: CompassPosition;
  parties: Party[];
  onBack: () => void;
}

interface PartyDistance {
  party: Party;
  distance: number;
  closestAxes: Array<{ axis: AxisId; diff: number }>;
  furthestAxes: Array<{ axis: AxisId; diff: number }>;
}

interface AiAnalysis {
  summary: string;
  surprises: string[];
  loading: boolean;
}

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

function analyzePartyDistances(position: CompassPosition, parties: Party[]): PartyDistance[] {
  return parties
    .map((party) => {
      const diffs = ALL_AXES.map((axis) => ({
        axis,
        diff: position[axis] - party.position[axis],
        absDiff: Math.abs(position[axis] - party.position[axis]),
      }));

      const sorted = [...diffs].sort((a, b) => a.absDiff - b.absDiff);
      const distance = Math.sqrt(diffs.reduce((s, d) => s + d.diff ** 2, 0));

      return {
        party,
        distance,
        closestAxes: sorted.slice(0, 2).map((d) => ({ axis: d.axis, diff: d.diff })),
        furthestAxes: sorted.slice(-2).reverse().map((d) => ({ axis: d.axis, diff: d.diff })),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

function AxisBar({ axis, userVal, partyVal, partyColor }: {
  axis: AxisId; userVal: number; partyVal: number; partyColor: string;
}) {
  const info = AXES[axis];
  const userPct = ((userVal + 1) / 2) * 100;
  const partyPct = ((partyVal + 1) / 2) * 100;

  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
        <span>{info.negative}</span>
        <span>{info.positive}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full relative">
        <div className="absolute left-1/2 top-0 w-px h-full bg-gray-700" />
        {/* Party marker */}
        <div
          className="absolute top-[-2px] w-1.5 h-[calc(100%+4px)] rounded-sm opacity-60"
          style={{ left: `${partyPct}%`, backgroundColor: partyColor, transform: 'translateX(-50%)' }}
        />
        {/* User marker */}
        <div
          className="absolute top-[-3px] w-2.5 h-[calc(100%+6px)] rounded-sm bg-purple-500"
          style={{ left: `${userPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  );
}

export function AnalysisScreen({ position, parties, onBack }: AnalysisScreenProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis>({ summary: '', surprises: [], loading: true });
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  const rankings = analyzePartyDistances(position, parties);
  const closest = rankings[0];
  const furthest = rankings[rankings.length - 1];

  // Fetch AI analysis
  useEffect(() => {
    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, parties: parties.map((p) => ({ id: p.id, label: p.label, abbreviation: p.abbreviation, position: p.position })) }),
    })
      .then((r) => r.json())
      .then((data) => setAiAnalysis({ ...data, loading: false }))
      .catch(() => {
        // Fallback: generate local analysis
        setAiAnalysis({
          summary: `Tu es le plus proche de ${closest.party.label} (${closest.party.abbreviation}) et le plus éloigné de ${furthest.party.label} (${furthest.party.abbreviation}).`,
          surprises: [
            closest.furthestAxes[0] &&
              `Malgré ta proximité avec ${closest.party.abbreviation}, vous divergez sur l'axe ${AXES[closest.furthestAxes[0].axis].negative}↔${AXES[closest.furthestAxes[0].axis].positive}.`,
          ].filter(Boolean) as string[],
          loading: false,
        });
      });
  }, [position, parties, closest, furthest]);

  const activeParty = selectedParty ? rankings.find((r) => r.party.id === selectedParty) : closest;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Mon analyse</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300">
          ← Menu
        </button>
      </div>

      {/* AI Summary */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
        {aiAnalysis.loading ? (
          <p className="text-gray-500 animate-pulse">Analyse en cours...</p>
        ) : (
          <>
            <p className="text-gray-200 leading-relaxed">{aiAnalysis.summary}</p>
            {aiAnalysis.surprises.length > 0 && (
              <ul className="mt-3 space-y-1">
                {aiAnalysis.surprises.map((s, i) => (
                  <li key={i} className="text-sm text-purple-300 flex gap-2">
                    <span className="text-purple-500 shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Party ranking */}
      <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
        Classement par proximité
      </h3>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {rankings.map((r, i) => (
          <button
            key={r.party.id}
            onClick={() => setSelectedParty(r.party.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              (selectedParty || closest.party.id) === r.party.id
                ? 'ring-2 ring-purple-500 bg-gray-800'
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            <span className="text-gray-500">#{i + 1}</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: r.party.color }}
            />
            <span>{r.party.abbreviation}</span>
            <span className="text-gray-600">{r.distance.toFixed(2)}</span>
          </button>
        ))}
      </div>

      {/* Detailed comparison with selected party */}
      {activeParty && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeParty.party.color }}
            />
            <h3 className="font-medium">{activeParty.party.label}</h3>
            <span className="text-sm text-gray-500">
              distance: {activeParty.distance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {ALL_AXES.map((axis) => (
              <AxisBar
                key={axis}
                axis={axis}
                userVal={position[axis]}
                partyVal={activeParty.party.position[axis]}
                partyColor={activeParty.party.color}
              />
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500 flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-3 bg-purple-500 rounded-sm" /> Toi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-3 rounded-sm opacity-60" style={{ backgroundColor: activeParty.party.color }} /> {activeParty.party.abbreviation}
            </span>
          </div>

          {/* Points communs & différences */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-xs text-green-400 uppercase tracking-wider mb-1">Points communs</h4>
              {activeParty.closestAxes.map(({ axis, diff }) => (
                <p key={axis} className="text-sm text-gray-300">
                  {AXES[axis].negative}↔{AXES[axis].positive}
                  <span className="text-gray-600 ml-1">(Δ{Math.abs(diff).toFixed(2)})</span>
                </p>
              ))}
            </div>
            <div>
              <h4 className="text-xs text-red-400 uppercase tracking-wider mb-1">Différences</h4>
              {activeParty.furthestAxes.map(({ axis, diff }) => (
                <p key={axis} className="text-sm text-gray-300">
                  {AXES[axis].negative}↔{AXES[axis].positive}
                  <span className="text-gray-600 ml-1">(Δ{Math.abs(diff).toFixed(2)})</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
