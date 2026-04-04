import { useState, useEffect } from 'react';
import type { CompassPosition, Party, AxisId } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';

import type { UserProfile } from '@/App';

interface AnalysisScreenProps {
  position: CompassPosition;
  parties: Party[];
  profile?: UserProfile | null;
  onBack: () => void;
}

interface AiAnalysis {
  summary: string;
  vsCitoyens: string;
  vsPartis: string;
  biases: Array<{
    category: 'media' | 'values';
    biasType: string;
    axis: string;
    description: string;
    strength: number;
    suggestedContent: string;
    suggestedSource?: string;
  }>;
  espritCritiquePistes: string[];
  loading: boolean;
}

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

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
      <div className="h-2 bg-gray-800 rounded-full relative" role="img" aria-label={`${info.negative} vs ${info.positive} — Toi: ${userVal.toFixed(2)}, Parti: ${partyVal.toFixed(2)}`}>
        <div className="absolute left-1/2 top-0 w-px h-full bg-gray-700" aria-hidden="true" />
        <div
          className="absolute top-[-2px] w-1.5 h-[calc(100%+4px)] rounded-sm opacity-60"
          style={{ left: `${partyPct}%`, backgroundColor: partyColor, transform: 'translateX(-50%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[-3px] w-2.5 h-[calc(100%+6px)] rounded-sm bg-purple-500"
          style={{ left: `${userPct}%`, transform: 'translateX(-50%)' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

type Tab = 'resume' | 'citoyens' | 'partis' | 'biais';

const LS_ANALYSIS = 'partiprism_analysis';
const LS_RESPONSES = 'partiprism_responses';
const ANALYSIS_QUESTION_THRESHOLD = 40;

interface CachedAnalysis {
  result: Omit<AiAnalysis, 'loading'>;
  questionCount: number;
}

export function AnalysisScreen({ position, parties, profile, onBack }: AnalysisScreenProps) {
  const [analysis, setAnalysis] = useState<AiAnalysis>({
    summary: '', vsCitoyens: '', vsPartis: '', biases: [], espritCritiquePistes: [], loading: true,
  });
  const [tab, setTab] = useState<Tab>('resume');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [canRerun, setCanRerun] = useState(false);

  // Load cached analysis or fetch new one
  useEffect(() => {
    const responses: Array<{ questionId: string }> = JSON.parse(localStorage.getItem(LS_RESPONSES) || '[]');
    const currentCount = responses.length;

    // Check for cached analysis
    try {
      const cached: CachedAnalysis | null = JSON.parse(localStorage.getItem(LS_ANALYSIS) || 'null');
      if (cached && cached.result) {
        setAnalysis({ ...cached.result, loading: false });
        // Can re-run if answered 40+ more questions since last analysis
        setCanRerun(currentCount - cached.questionCount >= ANALYSIS_QUESTION_THRESHOLD);
        return;
      }
    } catch {}

    // No cache — fetch analysis (one-shot, ephemeral on server)
    fetchAnalysis(currentCount);
  }, []);

  const fetchAnalysis = (questionCount: number) => {
    setAnalysis((prev) => ({ ...prev, loading: true }));

    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position,
        infoSource: profile?.infoSource,
        perceivedBias: profile?.perceivedBias,
        parties: parties.map((p) => ({
          id: p.id, label: p.label, abbreviation: p.abbreviation, position: p.position,
        })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAnalysis({ ...data, loading: false });
        setCanRerun(false);
        // Cache result with current question count
        localStorage.setItem(LS_ANALYSIS, JSON.stringify({
          result: data,
          questionCount,
        } satisfies CachedAnalysis));
      })
      .catch(() => setAnalysis((prev) => ({ ...prev, loading: false, summary: 'Analyse indisponible.' })));
  };

  // Party rankings
  const rankings = parties
    .map((p) => ({
      party: p,
      distance: Math.sqrt(ALL_AXES.reduce((s, ax) => s + (position[ax] - p.position[ax]) ** 2, 0)),
    }))
    .sort((a, b) => a.distance - b.distance);

  const activeParty = selectedParty
    ? rankings.find((r) => r.party.id === selectedParty)
    : rankings[0];

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'resume', label: 'Résumé' },
    { id: 'citoyens', label: 'vs Citoyens' },
    { id: 'partis', label: 'vs Partis' },
    { id: 'biais', label: 'Mes biais' },
  ];

  return (
    <section className="max-w-2xl mx-auto" aria-label="Mon analyse">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Mon analyse</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300 focus-ring rounded py-1 px-2">
          ← Menu
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div
        className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Sections d'analyse"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={`flex-1 min-w-0 py-2.5 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap touch-target focus-ring ${
              tab === t.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
            {t.id === 'biais' && analysis.biases.length > 0 && (
              <span className="ml-1 text-xs bg-purple-500/30 rounded-full px-1.5" aria-label={`${analysis.biases.length} biais détectés`}>
                {analysis.biases.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Re-run button (visible after 40+ new deep questions) */}
      {canRerun && !analysis.loading && (
        <button
          onClick={() => {
            const responses: Array<{ questionId: string }> = JSON.parse(localStorage.getItem(LS_RESPONSES) || '[]');
            fetchAnalysis(responses.length);
          }}
          className="mb-4 w-full py-2 bg-purple-900/30 border border-purple-800/40 text-purple-300 rounded-lg text-sm hover:bg-purple-900/50 transition-colors focus-ring"
        >
          Relancer l'analyse (tu as répondu à 40+ nouvelles questions)
        </button>
      )}

      {analysis.loading && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center" role="status" aria-live="polite">
          <p className="text-gray-400 animate-pulse">Analyse en cours...</p>
        </div>
      )}

      {/* RÉSUMÉ */}
      {!analysis.loading && tab === 'resume' && (
        <div className="space-y-4" id="panel-resume" role="tabpanel">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
            <p className="text-gray-200 leading-relaxed">{analysis.summary}</p>
          </div>
          {analysis.espritCritiquePistes.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
              <h3 className="text-sm text-purple-400 uppercase tracking-wider mb-2">
                Pour aller plus loin
              </h3>
              <ul className="space-y-1.5">
                {analysis.espritCritiquePistes.map((p, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-purple-500 shrink-0" aria-hidden="true">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* VS CITOYENS */}
      {!analysis.loading && tab === 'citoyens' && (
        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800" id="panel-citoyens" role="tabpanel">
          <p className="text-gray-200 leading-relaxed">{analysis.vsCitoyens}</p>
        </div>
      )}

      {/* VS PARTIS */}
      {!analysis.loading && tab === 'partis' && (
        <div className="space-y-4" id="panel-partis" role="tabpanel">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
            <p className="text-gray-200 leading-relaxed mb-4">{analysis.vsPartis}</p>
          </div>

          {/* Party selector */}
          <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Sélectionner un parti">
            {rankings.map((r, i) => (
              <button
                key={r.party.id}
                onClick={() => setSelectedParty(r.party.id)}
                role="option"
                aria-selected={(selectedParty || rankings[0].party.id) === r.party.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all focus-ring ${
                  (selectedParty || rankings[0].party.id) === r.party.id
                    ? 'ring-2 ring-purple-500 bg-gray-800'
                    : 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
                }`}
              >
                <span className="text-gray-600" aria-hidden="true">#{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.party.color }} aria-hidden="true" />
                <span>{r.party.abbreviation}</span>
              </button>
            ))}
          </div>

          {/* Axis comparison */}
          {activeParty && (
            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeParty.party.color }} aria-hidden="true" />
                <h3 className="font-medium">{activeParty.party.label}</h3>
                <span className="text-sm text-gray-500">distance: {activeParty.distance.toFixed(2)}</span>
              </div>
              {ALL_AXES.map((axis) => (
                <AxisBar
                  key={axis}
                  axis={axis}
                  userVal={position[axis]}
                  partyVal={activeParty.party.position[axis]}
                  partyColor={activeParty.party.color}
                />
              ))}
              <div className="mt-3 text-xs text-gray-500 flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-3 bg-purple-500 rounded-sm" aria-hidden="true" /> Toi
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-3 rounded-sm opacity-60" style={{ backgroundColor: activeParty.party.color }} aria-hidden="true" />
                  {activeParty.party.abbreviation}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BIAIS */}
      {!analysis.loading && tab === 'biais' && (
        <div className="space-y-3" id="panel-biais" role="tabpanel">
          {analysis.biases.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
              <p className="text-gray-400">Aucun biais significatif identifié.</p>
              <p className="text-sm text-gray-600 mt-1">Réponds à plus de questions pour affiner l'analyse.</p>
            </div>
          ) : (
            <>
              {/* Group by category */}
              {(['media', 'values'] as const).map((cat) => {
                const catBiases = analysis.biases.filter((b) => b.category === cat);
                if (catBiases.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="text-xs uppercase tracking-wider mb-2 mt-2 flex items-center gap-2">
                      <span className={cat === 'media' ? 'text-blue-400' : 'text-amber-400'}>
                        {cat === 'media' ? 'Biais liés à tes sources d\'info' : 'Biais liés à tes valeurs'}
                      </span>
                    </h3>
                    {catBiases.map((bias, i) => (
                      <article key={i} className={`rounded-xl p-4 border mb-2 ${
                        cat === 'media' ? 'bg-blue-950/20 border-blue-900/30' : 'bg-amber-950/20 border-amber-900/30'
                      }`}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <h4 className="font-medium text-sm">{bias.biasType.replace(/_/g, ' ')}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">{AXES[bias.axis as AxisId]?.negative}↔{AXES[bias.axis as AxisId]?.positive}</span>
                            <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden" role="img" aria-label={`Intensité: ${Math.round(bias.strength * 100)}%`}>
                              <div
                                className={`h-full rounded-full ${cat === 'media' ? 'bg-blue-500' : 'bg-amber-500'}`}
                                style={{ width: `${bias.strength * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{bias.description}</p>
                        <p className="text-xs text-purple-400">
                          {bias.suggestedContent}
                        </p>
                        {bias.suggestedSource && (
                          <p className="text-xs text-gray-500 mt-1">
                            Source à explorer : <span className="text-gray-300">{bias.suggestedSource}</span>
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </section>
  );
}
