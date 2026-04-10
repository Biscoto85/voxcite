import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Party, CompassPosition } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import { CompassCanvas1D } from './CompassCanvas1D';
import { CompassCanvas2D } from './CompassCanvas2D';
import { PartyLegend } from './PartyLegend';
import { getClosestParty } from '@/utils/scoring';
import { buildChallengeUrl } from '@/utils/challenge';

interface CompassRevealProps {
  parties: Party[];
  userPosition: CompassPosition;
  challengerPosition?: CompassPosition | null;
  onContinue: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getClosestParty1D(userPosition: CompassPosition, parties: Party[]): Party | null {
  const userVal = userPosition.societal * 0.4 + userPosition.economic * -0.6;
  let closest: Party | null = null;
  let minDist = Infinity;
  for (const party of parties) {
    if (!party.visibleOnCompass) continue;
    const dist = Math.abs(party.position1d - userVal);
    if (dist < minDist) { minDist = dist; closest = party; }
  }
  return closest;
}

function computeIntensity(pos: CompassPosition): number {
  const vals = [pos.societal, pos.economic, pos.authority, pos.ecology, pos.sovereignty];
  return vals.reduce((s, v) => s + Math.abs(v), 0) / vals.length;
}

function intensityLabel(intensity: number): { label: string; color: string } {
  if (intensity > 0.65) return { label: 'Position très tranchée', color: 'text-orange-400' };
  if (intensity > 0.45) return { label: 'Position tranchée', color: 'text-yellow-400' };
  if (intensity > 0.25) return { label: 'Position nuancée', color: 'text-emerald-400' };
  return { label: 'Position très nuancée', color: 'text-blue-400' };
}

type AxisKey = keyof CompassPosition;

const AXIS_LABEL: Record<AxisKey, (v: number) => string | null> = {
  societal:    (v) => v > 0.2 ? 'progressiste'      : v < -0.2 ? 'conservateur·trice' : null,
  economic:    (v) => v > 0.2 ? 'libéral·e'          : v < -0.2 ? 'interventionniste'  : null,
  authority:   (v) => v > 0.2 ? 'libertaire'         : v < -0.2 ? 'autoritaire'         : null,
  ecology:     (v) => v > 0.2 ? 'écologiste'         : v < -0.2 ? 'productiviste'       : null,
  sovereignty: (v) => v > 0.2 ? 'mondialiste'        : v < -0.2 ? 'souverainiste'       : null,
};

/** Top-3 dominant axes description for the share phrase */
function buildSharePhrase(pos: CompassPosition, closest: Party | null): string {
  const axes: AxisKey[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

  // Sort by absolute value descending
  const sorted = axes
    .map((k) => ({ key: k, val: pos[k], abs: Math.abs(pos[k]) }))
    .sort((a, b) => b.abs - a.abs);

  // Take up to 3 with |val| > 0.2, get their labels
  const labels = sorted
    .slice(0, 3)
    .map(({ key, val }) => AXIS_LABEL[key](val))
    .filter((l): l is string => l !== null);

  const descList =
    labels.length === 0 ? 'centriste sur tous les axes'
    : labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} et ${labels[1]}`
    : `${labels[0]}, ${labels[1]} et ${labels[2]}`;

  const intensity = computeIntensity(pos);
  const tone = intensity > 0.55
    ? 'Des convictions bien tranchées — vous aussi ?'
    : 'Un positionnement plus nuancé qu\'il n\'y paraît.';

  const partyPart = closest ? `, proche de ${closest.label} sur 5 axes` : '';

  return `Je suis ${descList}${partyPart}. ${tone} Mon vrai positionnement sur partiprism.fr`;
}

/** Compute distance between two positions */
function distance(a: CompassPosition, b: CompassPosition): number {
  const axes: AxisKey[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];
  return Math.sqrt(axes.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
}

type Phase = '1d' | 'transition' | '2d';

// ── Component ──────────────────────────────────────────────────────────

export function CompassReveal({ parties, userPosition, challengerPosition, onContinue }: CompassRevealProps) {
  const [phase, setPhase] = useState<Phase>('1d');
  const [opacity1D, setOpacity1D] = useState(1);
  const [opacity2D, setOpacity2D] = useState(0);
  const [copied, setCopied] = useState(false);
  const [challengeLinkCopied, setChallengeLinkCopied] = useState(false);

  const closest1D = useMemo(() => getClosestParty1D(userPosition, parties), [userPosition, parties]);
  const closest2D = useMemo(() => getClosestParty(userPosition, parties), [userPosition, parties]);

  const [highlightedPartyId, setHighlightedPartyId] = useState<string | null>(null);
  const visiblePartyIds = new Set(parties.map((p) => p.id));

  const partyChanged = closest1D && closest2D && closest1D.id !== closest2D.id;

  const intensity = useMemo(() => computeIntensity(userPosition), [userPosition]);
  const intensityInfo = useMemo(() => intensityLabel(intensity), [intensity]);
  const sharePhrase = useMemo(() => buildSharePhrase(userPosition, closest2D), [userPosition, closest2D]);

  // Auto-transition 1D → 2D
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('transition');
      setOpacity2D(0);
      requestAnimationFrame(() => { setOpacity1D(0); setOpacity2D(1); });
    }, 3000);
    const t2 = setTimeout(() => setPhase('2d'), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Copy share phrase
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sharePhrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [sharePhrase]);

  // Web Share API (mobile native sheet) / fallback copy
  const handleChallenge = useCallback(() => {
    const url = buildChallengeUrl(userPosition);
    const text = 'Je viens de tester mon positionnement politique en 5 axes sur PartiPrism — relève le défi et compare nos résultats !';

    if (navigator.share) {
      navigator.share({ title: 'Défi PartiPrism', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setChallengeLinkCopied(true);
        setTimeout(() => setChallengeLinkCopied(false), 2500);
      }).catch(() => {});
    }
  }, [userPosition]);

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePhrase)}`;

  // Challenge comparison metrics
  const challengerDist = challengerPosition ? distance(userPosition, challengerPosition) : null;
  const challengerAxesDiff = challengerPosition
    ? (['societal', 'economic', 'authority', 'ecology', 'sovereignty'] as AxisKey[])
        .map((k) => ({ key: k, diff: userPosition[k] - challengerPosition[k], absDiff: Math.abs(userPosition[k] - challengerPosition[k]) }))
        .sort((a, b) => b.absDiff - a.absDiff)
    : [];

  return (
    <section className="max-w-4xl mx-auto flex flex-col gap-4" aria-label="Révélation du positionnement">

      {/* Challenge banner — shown when viewing someone's challenge */}
      {challengerPosition && (
        <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0" aria-hidden="true">⚡</span>
          <div>
            <p className="text-sm font-semibold text-indigo-200">Tu relèves un défi !</p>
            <p className="text-xs text-indigo-400">Quelqu'un t'a invité à comparer vos positions — la leur apparaît en indigo sur le compas.</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-1">Ton positionnement</h2>
        {phase === '1d' && closest1D && (
          <p className="text-gray-400 text-sm">
            Sur l'axe gauche-droite, le plus proche :
            <span className="ml-1 font-medium" style={{ color: closest1D.color }}>{closest1D.label}</span>
          </p>
        )}
        {phase !== '1d' && closest2D && (
          partyChanged ? (
            <p className="text-sm" aria-live="polite">
              <span className="text-gray-500">En réalité, sur 5 axes :</span>
              <span className="ml-1 font-semibold" style={{ color: closest2D.color }}>{closest2D.label}</span>
              <span className="text-gray-600 text-xs ml-1">(pas {closest1D!.abbreviation})</span>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              Parti le plus proche :
              <span className="ml-1 font-medium" style={{ color: closest2D.color }}>{closest2D.label}</span>
            </p>
          )
        )}
      </div>

      {/* Canvas */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        {phase === '1d' && (
          <CompassCanvas1D parties={parties} userPosition={userPosition}
            highlightedPartyId={highlightedPartyId} onPartyHover={setHighlightedPartyId} />
        )}
        {phase === 'transition' && (
          <div className="relative" style={{ minHeight: 400 }}>
            <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: opacity1D }}>
              <CompassCanvas1D parties={parties} userPosition={userPosition}
                highlightedPartyId={highlightedPartyId} onPartyHover={setHighlightedPartyId} />
            </div>
            <div className="transition-opacity duration-700" style={{ opacity: opacity2D }}>
              <CompassCanvas2D parties={parties} userPosition={userPosition} challengerPosition={challengerPosition}
                xAxis="societal" yAxis="economic"
                highlightedPartyId={highlightedPartyId} onPartyHover={setHighlightedPartyId} />
            </div>
          </div>
        )}
        {phase === '2d' && (
          <CompassCanvas2D parties={parties} userPosition={userPosition} challengerPosition={challengerPosition}
            xAxis="societal" yAxis="economic"
            highlightedPartyId={highlightedPartyId} onPartyHover={setHighlightedPartyId} />
        )}
      </div>

      <PartyLegend parties={parties} visibleIds={visiblePartyIds}
        highlightedId={highlightedPartyId} onToggle={() => {}} onToggleAll={() => {}}
        onHighlight={setHighlightedPartyId} />

      {/* Challenge comparison panel */}
      {phase === '2d' && challengerPosition && challengerAxesDiff.length > 0 && (
        <div className="bg-indigo-950/20 rounded-xl p-4 border border-indigo-800/30">
          <h3 className="text-sm font-semibold text-indigo-200 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" aria-hidden="true" />
            Toi vs le challenger
            {challengerDist !== null && (
              <span className="ml-auto text-xs font-normal text-indigo-400/70">
                Distance globale : {challengerDist.toFixed(2)}
                {challengerDist < 0.5 ? ' — très proches !' : challengerDist < 1.2 ? ' — quelques différences' : ' — positions assez éloignées'}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {challengerAxesDiff.slice(0, 3).map(({ key, diff, absDiff }) => {
              const axisInfo = AXES[key];
              const userSide = userPosition[key] > 0 ? axisInfo.positive : axisInfo.negative;
              const challSide = challengerPosition[key] > 0 ? axisInfo.positive : axisInfo.negative;
              return (
                <div key={key} className="text-xs">
                  <div className="flex justify-between text-gray-500 mb-0.5">
                    <span>{axisInfo.negative}</span>
                    <span className={`font-medium ${absDiff > 0.5 ? 'text-orange-400' : 'text-indigo-400'}`}>
                      écart {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                    </span>
                    <span>{axisInfo.positive}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full relative">
                    <div className="absolute left-1/2 top-0 w-px h-full bg-gray-700" />
                    {/* Challenger (indigo) */}
                    <div className="absolute top-[-2px] w-2 h-[calc(100%+4px)] rounded-sm bg-indigo-400 opacity-70"
                      style={{ left: `${((challengerPosition[key] + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }} />
                    {/* User (amber) */}
                    <div className="absolute top-[-3px] w-3 h-[calc(100%+6px)] rounded-sm bg-amber-400"
                      style={{ left: `${((userPosition[key] + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }} />
                  </div>
                  {absDiff > 0.3 && (
                    <p className="text-gray-500 mt-0.5">
                      Toi : <span className="text-gray-300">{userSide}</span> — eux : <span className="text-indigo-300">{challSide}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-400 rounded-sm" /> Toi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-sm opacity-70" /> Challenger</span>
          </div>
        </div>
      )}

      {/* Indicators + share — visible in 2D phase */}
      {phase === '2d' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
            <span className={`text-sm font-medium ${intensityInfo.color}`}>{intensityInfo.label}</span>
            <span className="text-xs text-gray-600 ml-auto">({Math.round(intensity * 100)}% d'intensité)</span>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Ta phrase à partager</p>
            <p className="text-sm text-gray-200 leading-relaxed italic">"{sharePhrase}"</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors focus-ring">
              {copied ? <><span aria-hidden="true">✓</span> Copié !</> : <><span aria-hidden="true">📋</span> Copier</>}
            </button>
            <a href={xUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors focus-ring">
              <span aria-hidden="true">𝕏</span> Partager sur X
            </a>
            <button onClick={handleChallenge}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg text-xs text-indigo-200 transition-colors focus-ring ml-auto">
              {challengeLinkCopied
                ? <><span aria-hidden="true">✓</span> Lien copié !</>
                : <><span aria-hidden="true">⚡</span> Défier quelqu'un</>}
            </button>
          </div>
        </div>
      )}

      {/* Hint + Continue */}
      <div className="text-center pb-4">
        {phase === '1d' && (
          <p className="text-xs text-gray-500 animate-pulse" aria-live="polite">L'axe gauche-droite ne dit pas tout...</p>
        )}
        {(phase === 'transition' || phase === '2d') && (
          <p className="text-xs text-gray-500 mb-3">
            {partyChanged ? 'L\'axe unique masquait ta vraie position.' : 'Axe sociétal × économique — ton vrai positionnement'}
          </p>
        )}
        {phase === '2d' && (
          <button onClick={onContinue}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 rounded-lg font-medium transition-colors touch-target focus-ring">
            Continuer →
          </button>
        )}
      </div>
    </section>
  );
}
