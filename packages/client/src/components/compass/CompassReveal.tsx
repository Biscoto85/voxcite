import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Party, CompassPosition } from '@partiprism/shared';
import { CompassCanvas1D } from './CompassCanvas1D';
import { CompassCanvas2D } from './CompassCanvas2D';
import { PartyLegend } from './PartyLegend';
import { getClosestParty } from '@/utils/scoring';

interface CompassRevealProps {
  parties: Party[];
  userPosition: CompassPosition;
  onContinue: (isOrphan: boolean) => void;
}

/** Closest party on 1D axis only (gauche-droite projection) */
function getClosestParty1D(userPosition: CompassPosition, parties: Party[]): Party | null {
  const userVal = userPosition.societal * 0.4 + userPosition.economic * -0.6;
  let closest: Party | null = null;
  let minDist = Infinity;

  for (const party of parties) {
    if (!party.visibleOnCompass) continue;
    const dist = Math.abs(party.position1d - userVal);
    if (dist < minDist) {
      minDist = dist;
      closest = party;
    }
  }
  return closest;
}

/** Mean of absolute axis values — measures how "tranchée" the position is */
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

/** Generate shareable phrase from position */
function buildSharePhrase(pos: CompassPosition, closest: Party | null): string {
  const societalDir =
    pos.societal > 0.25 ? 'progressiste' :
    pos.societal < -0.25 ? 'conservateur·trice' :
    'centriste sur le sociétal';

  const econDir =
    pos.economic > 0.25 ? 'libéral·e économiquement' :
    pos.economic < -0.25 ? 'interventionniste économiquement' :
    'équilibré·e économiquement';

  const intensity = computeIntensity(pos);
  const tone = intensity > 0.55 ? 'Des convictions bien tranchées — vous aussi ?' : 'Un positionnement plus nuancé qu\'il n\'y paraît.';

  const partyPart = closest ? `, proches de ${closest.label} sur 5 axes` : '';

  return `Je suis ${societalDir} et ${econDir}${partyPart}. ${tone} Découvrez votre vrai positionnement → partiprism.fr`;
}

type Phase = '1d' | 'transition' | '2d' | 'orphelin';

export function CompassReveal({ parties, userPosition, onContinue }: CompassRevealProps) {
  const [phase, setPhase] = useState<Phase>('1d');
  const [opacity1D, setOpacity1D] = useState(1);
  const [opacity2D, setOpacity2D] = useState(0);
  const [copied, setCopied] = useState(false);
  const [orphanPct, setOrphanPct] = useState<number | null>(null);

  const closest1D = useMemo(() => getClosestParty1D(userPosition, parties), [userPosition, parties]);
  const closest2D = useMemo(() => getClosestParty(userPosition, parties), [userPosition, parties]);

  const [highlightedPartyId, setHighlightedPartyId] = useState<string | null>(null);
  const visiblePartyIds = new Set(parties.map((p) => p.id));

  const partyChanged = closest1D && closest2D && closest1D.id !== closest2D.id;

  const intensity = useMemo(() => computeIntensity(userPosition), [userPosition]);
  const intensityInfo = useMemo(() => intensityLabel(intensity), [intensity]);
  const sharePhrase = useMemo(() => buildSharePhrase(userPosition, closest2D), [userPosition, closest2D]);

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

  // Fetch orphan stats for the counter in phase orphelin
  useEffect(() => {
    fetch('/api/nebula/orphan-stats')
      .then((r) => r.json())
      .then((d) => { if (d.orphanPct !== null) setOrphanPct(d.orphanPct); })
      .catch(() => {});
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sharePhrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [sharePhrase]);

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePhrase)}`;

  return (
    <section className="max-w-4xl mx-auto flex flex-col gap-4" aria-label="Révélation du positionnement">
      {/* Title — changes between phases */}
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-1">Ton positionnement</h2>

        {phase === '1d' && closest1D && (
          <p className="text-gray-400 text-sm">
            Sur l'axe gauche-droite, le plus proche :
            <span className="ml-1 font-medium" style={{ color: closest1D.color }}>
              {closest1D.label}
            </span>
          </p>
        )}

        {(phase === '2d' || phase === 'transition') && closest2D && (
          <div>
            {partyChanged ? (
              <p className="text-sm" aria-live="polite">
                <span className="text-gray-500">En réalité, sur 5 axes :</span>
                <span className="ml-1 font-semibold" style={{ color: closest2D.color }}>
                  {closest2D.label}
                </span>
                <span className="text-gray-600 text-xs ml-1">(pas {closest1D!.abbreviation})</span>
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                Parti le plus proche :
                <span className="ml-1 font-medium" style={{ color: closest2D.color }}>
                  {closest2D.label}
                </span>
              </p>
            )}
          </div>
        )}

        {phase === 'orphelin' && (
          <p className="text-gray-400 text-sm">Une dernière question avant d'accéder au menu</p>
        )}
      </div>

      {/* Canvas area — shown in 1d/transition/2d phases */}
      {phase !== 'orphelin' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          {phase === '1d' && (
            <CompassCanvas1D
              parties={parties}
              userPosition={userPosition}
              highlightedPartyId={highlightedPartyId}
              onPartyHover={setHighlightedPartyId}
            />
          )}

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
      )}

      {/* Legend — shown in 1d/transition/2d phases */}
      {phase !== 'orphelin' && (
        <PartyLegend
          parties={parties}
          visibleIds={visiblePartyIds}
          highlightedId={highlightedPartyId}
          onToggle={() => {}}
          onToggleAll={() => {}}
          onHighlight={setHighlightedPartyId}
        />
      )}

      {/* ── Phase 2D: indicators + share ── */}
      {phase === '2d' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
          {/* Intensity indicator */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
            <span className={`text-sm font-medium ${intensityInfo.color}`}>{intensityInfo.label}</span>
            <span className="text-xs text-gray-600 ml-auto">
              ({Math.round(intensity * 100)}% d'intensité)
            </span>
          </div>

          {/* Share phrase */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Ta phrase à partager</p>
            <p className="text-sm text-gray-200 leading-relaxed italic">"{sharePhrase}"</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors focus-ring"
              aria-label="Copier la phrase"
            >
              {copied ? (
                <><span aria-hidden="true">✓</span> Copié !</>
              ) : (
                <><span aria-hidden="true">📋</span> Copier</>
              )}
            </button>
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors focus-ring"
              aria-label="Partager sur X (Twitter)"
            >
              <span aria-hidden="true">𝕏</span> Partager sur X
            </a>
          </div>
        </div>
      )}

      {/* ── Phase orphelin ── */}
      {phase === 'orphelin' && (
        <div className="bg-gray-900 rounded-xl p-6 sm:p-8 border border-gray-800 max-w-xl mx-auto w-full">
          <div className="text-center mb-6">
            <p className="text-2xl mb-3" aria-hidden="true">🗳</p>
            <h3 className="text-lg font-semibold text-white mb-2">
              Es-tu orphelin·e politique ?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Réponds selon ton ressenti — pas de bonne ou mauvaise réponse.
            </p>
            {orphanPct !== null && (
              <p className="text-xs text-indigo-400 mt-2">
                {orphanPct}% des utilisateurs se déclarent orphelins politiques
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onContinue(true)}
              className="w-full py-4 px-5 rounded-xl border border-indigo-700/50 bg-indigo-950/30 hover:bg-indigo-900/40 text-left transition-colors focus-ring group"
            >
              <p className="text-sm font-medium text-indigo-200 group-hover:text-indigo-100">
                Oui — aucun parti ne me représente vraiment
              </p>
              <p className="text-xs text-indigo-400/70 mt-0.5">
                Je vote parfois pour le moins pire, ou je m'abstiens
              </p>
            </button>

            <button
              onClick={() => onContinue(false)}
              className="w-full py-4 px-5 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-left transition-colors focus-ring group"
            >
              <p className="text-sm font-medium text-gray-200 group-hover:text-white">
                Non — je me retrouve assez bien dans un parti ou ses idées
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Même si ce n'est pas parfait
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Hint + Continue button */}
      <div className="text-center pb-4">
        {phase === '1d' && (
          <p className="text-xs text-gray-500 animate-pulse" aria-live="polite">L'axe gauche-droite ne dit pas tout...</p>
        )}
        {phase === '2d' && (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {partyChanged
                ? 'L\'axe unique masquait ta vraie position.'
                : 'Axe sociétal × économique — ton vrai positionnement'}
            </p>
            <button
              onClick={() => setPhase('orphelin')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 rounded-lg font-medium transition-colors touch-target focus-ring"
            >
              Continuer →
            </button>
          </>
        )}
        {phase === 'transition' && (
          <p className="text-xs text-gray-500 mb-3">
            {partyChanged
              ? 'L\'axe unique masquait ta vraie position.'
              : 'Axe sociétal × économique — ton vrai positionnement'}
          </p>
        )}
      </div>
    </section>
  );
}
