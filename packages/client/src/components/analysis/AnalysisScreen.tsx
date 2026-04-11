import { useState, useEffect, useCallback } from 'react';
import type { CompassPosition, Party, AxisId } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';

import type { UserProfile } from '@/App';
import { MediaSourcesPanel } from './MediaSourcesPanel';
import { getShareCount } from '@/components/share/SharePanel';

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
          className="absolute top-[-3px] w-2.5 h-[calc(100%+6px)] rounded-sm bg-amber-400"
          style={{ left: `${userPct}%`, transform: 'translateX(-50%)' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

type Tab = 'resume' | 'citoyens' | 'partis' | 'biais';

const LS_ANALYSIS = 'partiprism_analysis';
const LS_ANALYSIS_DEEP = 'partiprism_analysis_deep';
const LS_RESPONSES = 'partiprism_responses';
const LS_ORPHAN = 'partiprism_is_orphan';
const ANALYSIS_QUESTION_THRESHOLD = 40;
const SONNET_UNLOCK_SHARE_COUNT = 5; // number of shares needed to unlock deep analysis

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
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [sonnetUnlocked] = useState(() => getShareCount() >= SONNET_UNLOCK_SHARE_COUNT);
  const [deepAnalysis, setDeepAnalysis] = useState<AiAnalysis>({
    summary: '', vsCitoyens: '', vsPartis: '', biases: [], espritCritiquePistes: [], loading: false,
  });
  const [showDeep, setShowDeep] = useState(false);
  // Orphelin
  const [isOrphan, setIsOrphan] = useState<boolean | null>(() => {
    const saved = localStorage.getItem(LS_ORPHAN);
    return saved === null ? null : saved === 'true';
  });
  const [orphanPct, setOrphanPct] = useState<number | null>(null);

  // Load cached analysis or fetch new one
  useEffect(() => {
    const responses: Array<{ questionId: string }> = JSON.parse(localStorage.getItem(LS_RESPONSES) || '[]');
    const currentCount = responses.length;

    // Check for cached analysis
    try {
      const cached: CachedAnalysis | null = JSON.parse(localStorage.getItem(LS_ANALYSIS) || 'null');
      if (cached && cached.result) {
        // Guard: reject broken caches where summary looks like raw JSON (from old extractJSON bug)
        const s = cached.result.summary?.trim() ?? '';
        const isBroken = s.startsWith('{') || s.startsWith('[') || s.includes('"summary"') || s.includes('"vsPartis"');
        if (isBroken) {
          localStorage.removeItem(LS_ANALYSIS);
        } else {
          setAnalysis({ ...cached.result, loading: false });
          // Can re-run if answered 40+ more questions since last analysis
          setCanRerun(currentCount - cached.questionCount >= ANALYSIS_QUESTION_THRESHOLD);
          return;
        }
      }
    } catch {}

    // No cache — fetch analysis (one-shot, ephemeral on server)
    fetchAnalysis(currentCount);
  }, []);

  const buildRequestBody = (isDeep = false) => {
    const savedResponses: Array<{ questionId: string; value: number }> = JSON.parse(
      localStorage.getItem(LS_RESPONSES) || '[]',
    );
    return {
      position,
      infoSource: profile?.infoSource,
      perceivedBias: profile?.perceivedBias,
      infoFormats: profile?.infoFormats,
      mediaSources: profile?.mediaSources,
      infoDiversity: profile?.infoDiversity,
      mediaRelationship: profile?.mediaRelationship,
      responses: savedResponses,
      deepAnalysis: isDeep,
      parties: parties.map((p) => ({
        id: p.id, label: p.label, abbreviation: p.abbreviation, position: p.position,
      })),
    };
  };

  /** Enqueue a job and poll until done. Returns the result or throws. */
  const pollAnalysis = async (isDeep = false): Promise<Omit<AiAnalysis, 'loading'>> => {
    const body = buildRequestBody(isDeep);

    // Enqueue
    const enqueueRes = await fetch('/api/analysis/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!enqueueRes.ok) throw new Error(`Enqueue failed: ${enqueueRes.status}`);
    const { jobId } = await enqueueRes.json() as { jobId: string };

    // Poll with exponential backoff — 2s→3s→5s→8s→10s (cap), timeout 60s
    const POLL_INTERVALS = [2_000, 3_000, 5_000, 8_000, 10_000];
    const MAX_WAIT_MS = 60_000;

    return new Promise((resolve, reject) => {
      const start = Date.now();
      let attempt = 0;

      const poll = async () => {
        if (Date.now() - start > MAX_WAIT_MS) {
          reject(new Error('Timeout'));
          return;
        }
        try {
          const r = await fetch(`/api/analysis/queue/${jobId}`);
          const data = await r.json() as { status: string; result?: Omit<AiAnalysis, 'loading'>; error?: string };
          if (data.status === 'done' && data.result) {
            resolve(data.result);
            return;
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Analysis failed'));
            return;
          }
          // else: still pending/processing — keep polling
        } catch { /* network hiccup — keep trying */ }

        const delay = POLL_INTERVALS[Math.min(attempt, POLL_INTERVALS.length - 1)];
        attempt++;
        setTimeout(poll, delay);
      };

      setTimeout(poll, POLL_INTERVALS[0]);
      attempt = 1;
    });
  };

  const fetchAnalysis = (questionCount: number) => {
    setAnalysis((prev) => ({ ...prev, loading: true }));

    pollAnalysis(false)
      .then((data) => {
        setAnalysis({ ...data, loading: false });
        setCanRerun(false);
        localStorage.setItem(LS_ANALYSIS, JSON.stringify({
          result: data,
          questionCount,
        } satisfies CachedAnalysis));
      })
      .catch(() => setAnalysis((prev) => ({ ...prev, loading: false, summary: 'Analyse indisponible.' })));
  };

  const fetchDeepAnalysis = () => {
    // Check cache first
    try {
      const cached: CachedAnalysis | null = JSON.parse(localStorage.getItem(LS_ANALYSIS_DEEP) || 'null');
      if (cached?.result) {
        const s = cached.result.summary?.trim() ?? '';
        const isBroken = s.startsWith('{') || s.startsWith('[') || s.includes('"summary"') || s.includes('"vsPartis"');
        if (isBroken) {
          localStorage.removeItem(LS_ANALYSIS_DEEP);
        } else {
          setDeepAnalysis({ ...cached.result, loading: false });
          setShowDeep(true);
          return;
        }
      }
    } catch {}

    setDeepAnalysis((prev) => ({ ...prev, loading: true }));
    setShowDeep(true);

    pollAnalysis(true)
      .then((data) => {
        setDeepAnalysis({ ...data, loading: false });
        const responses: Array<{ questionId: string }> = JSON.parse(localStorage.getItem(LS_RESPONSES) || '[]');
        localStorage.setItem(LS_ANALYSIS_DEEP, JSON.stringify({
          result: data,
          questionCount: responses.length,
        } satisfies CachedAnalysis));
      })
      .catch(() => setDeepAnalysis((prev) => ({ ...prev, loading: false, summary: 'Analyse approfondie indisponible.' })));
  };

  // Fetch orphan stats once
  useEffect(() => {
    fetch('/api/nebula/orphan-stats')
      .then((r) => r.json())
      .then((d) => { if (d.orphanPct !== null) setOrphanPct(d.orphanPct); })
      .catch(() => {});
  }, []);

  const handleOrphanAnswer = useCallback((answer: boolean) => {
    setIsOrphan(answer);
    localStorage.setItem(LS_ORPHAN, String(answer));
    fetch('/api/sessions/orphan-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOrphan: answer }),
    }).catch(() => {});
  }, []);

  const handleCopySummary = useCallback(() => {
    const text = [
      analysis.summary,
      analysis.espritCritiquePistes.length > 0
        ? '\nPour aller plus loin :\n' + analysis.espritCritiquePistes.map((p) => `→ ${p}`).join('\n')
        : '',
      '\nMon analyse complète sur partiprism.fr',
    ].join('');
    navigator.clipboard.writeText(text).then(() => {
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2000);
    }).catch(() => {});
  }, [analysis.summary, analysis.espritCritiquePistes]);

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
        <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">
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
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
            {t.id === 'biais' && (profile?.infoDiversity || analysis.biases.length > 0) && (
              <span className="ml-1 text-xs bg-indigo-400/30 rounded-full px-1.5"
                aria-label={analysis.biases.length > 0 ? `${analysis.biases.length} biais IA détectés` : 'Analyse sources disponible'}>
                {analysis.biases.length > 0 ? analysis.biases.length : '●'}
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
          className="mb-4 w-full py-2 bg-amber-900/30 border border-amber-800/40 text-amber-300 rounded-lg text-sm hover:bg-amber-900/50 transition-colors focus-ring"
        >
          Relancer l'analyse (tu as répondu à 40+ nouvelles questions)
        </button>
      )}

      {/* Sonnet unlock — visible once user has shared 5+ times */}
      {sonnetUnlocked && !showDeep && !analysis.loading && analysis.summary && (
        <button
          onClick={fetchDeepAnalysis}
          className="mb-4 w-full py-3 bg-indigo-900/40 border border-indigo-700/50 text-indigo-200 rounded-xl text-sm hover:bg-indigo-900/60 transition-colors focus-ring flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">✦</span>
          Approfondir l'analyse avec Claude Sonnet
          <span className="text-xs text-indigo-400">(débloqué grâce à tes partages)</span>
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
            {analysis.summary && (
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors focus-ring"
                  aria-label="Copier le résumé"
                >
                  {summaryCopied ? (
                    <><span aria-hidden="true">✓</span> Copié !</>
                  ) : (
                    <><span aria-hidden="true">📋</span> Copier le résumé</>
                  )}
                </button>
              </div>
            )}
          </div>
          {analysis.espritCritiquePistes.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
              <h3 className="text-sm text-amber-400 uppercase tracking-wider mb-2">
                Pour aller plus loin
              </h3>
              <ul className="space-y-1.5">
                {analysis.espritCritiquePistes.map((p, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-amber-400 shrink-0" aria-hidden="true">→</span>{p}
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

          {/* Bloc orphelin — question ou résultat */}
          {isOrphan === null ? (
            <div className="bg-indigo-950/30 rounded-xl p-4 sm:p-5 border border-indigo-800/40">
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Pour toi, après analyse</p>
              <h3 className="text-base font-semibold text-white mb-1">Es-tu orphelin·e politique ?</h3>
              <p className="text-xs text-indigo-300/70 mb-4">
                Analysez vos écarts avec les différents partis avant de répondre à cette question.
                {orphanPct !== null && (
                  <span className="ml-1 text-indigo-400">{orphanPct}% des utilisateurs se déclarent orphelins.</span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleOrphanAnswer(true)}
                  className="flex-1 py-3 px-4 rounded-lg border border-indigo-700/50 bg-indigo-900/30 hover:bg-indigo-800/40 text-left text-sm text-indigo-200 transition-colors focus-ring"
                >
                  <span className="font-medium block">Oui — orphelin·e</span>
                  <span className="text-xs text-indigo-400/70">Aucun parti ne me représente vraiment</span>
                </button>
                <button
                  onClick={() => handleOrphanAnswer(false)}
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-left text-sm text-gray-200 transition-colors focus-ring"
                >
                  <span className="font-medium block">Non — je me retrouve dans un parti</span>
                  <span className="text-xs text-gray-500">Même imparfaitement</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${
              isOrphan
                ? 'bg-indigo-950/30 border-indigo-800/40'
                : 'bg-gray-900 border-gray-800'
            }`}>
              <span className="text-xl" aria-hidden="true">{isOrphan ? '🗳' : '✓'}</span>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {isOrphan ? 'Tu te déclares orphelin·e politique' : 'Tu te retrouves dans un parti'}
                </p>
                {orphanPct !== null && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isOrphan
                      ? `Comme ${orphanPct}% des utilisateurs PartiPrism`
                      : `${orphanPct}% des utilisateurs se déclarent orphelins — tu fais partie des autres`}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setIsOrphan(null); localStorage.removeItem(LS_ORPHAN); }}
                className="ml-auto text-xs text-gray-600 hover:text-gray-400 focus-ring rounded px-1"
                aria-label="Changer la réponse"
              >
                Changer
              </button>
            </div>
          )}

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
                    ? 'ring-2 ring-amber-400 bg-gray-800'
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
                  <span className="w-2.5 h-3 bg-amber-400 rounded-sm" aria-hidden="true" /> Toi
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
          {/* Analyse visuelle des sources (client-side) */}
          <MediaSourcesPanel profile={profile} userPosition={position} />

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
                        <p className="text-xs text-amber-400">
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

      {/* Deep analysis panel (Sonnet) */}
      {showDeep && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300">
            <span aria-hidden="true">✦</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Analyse approfondie (Claude Sonnet)</h3>
          </div>

          {deepAnalysis.loading ? (
            <div className="bg-indigo-950/20 rounded-xl p-6 border border-indigo-800/30 text-center" role="status" aria-live="polite">
              <p className="text-indigo-300 animate-pulse">Analyse approfondie en cours...</p>
              <p className="text-xs text-indigo-500 mt-1">Peut prendre jusqu'à 30 secondes</p>
            </div>
          ) : deepAnalysis.summary ? (
            <>
              <div className="bg-indigo-950/20 rounded-xl p-4 sm:p-5 border border-indigo-800/30">
                <p className="text-gray-200 leading-relaxed">{deepAnalysis.summary}</p>
              </div>
              {deepAnalysis.espritCritiquePistes.length > 0 && (
                <div className="bg-indigo-950/20 rounded-xl p-4 sm:p-5 border border-indigo-800/30">
                  <h4 className="text-sm text-indigo-400 uppercase tracking-wider mb-2">Pour aller plus loin (Sonnet)</h4>
                  <ul className="space-y-1.5">
                    {deepAnalysis.espritCritiquePistes.map((p, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-indigo-400 shrink-0" aria-hidden="true">→</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
