import { useState, useEffect } from 'react';
import type { CompassPosition } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import type { UserProfile } from '@/App';

// ── Types ─────────────────────────────────────────────────────────────

interface MediaWithPos {
  id: string;
  label: string;
  positionSocietal: number;
  positionEconomic: number;
  positionAuthority: number;
  positionEcology: number;
  positionSovereignty: number;
}

// ── Config du radar (pentagon, sommet en haut, sens horaire) ──────────

// angle en degrés depuis l'axe X (SVG), sens horaire
const RADAR_AXES: Array<{ key: keyof CompassPosition; angle: number; posLabel: string; negLabel: string }> = [
  { key: 'societal',    angle: -90,  posLabel: 'Progressiste',  negLabel: 'Conservateur' },
  { key: 'economic',   angle: -18,  posLabel: 'Libéral',       negLabel: 'Interventionniste' },
  { key: 'ecology',    angle:  54,  posLabel: 'Écologiste',    negLabel: 'Productiviste' },
  { key: 'sovereignty', angle: 126, posLabel: 'Mondialiste',   negLabel: 'Souverainiste' },
  { key: 'authority',  angle: 198,  posLabel: 'Libertaire',    negLabel: 'Autoritaire' },
];

const CX = 130, CY = 130, MAX_R = 85, LABEL_R = 108;
const RAD = Math.PI / 180;

function pt(angle: number, r: number): [number, number] {
  return [CX + r * Math.cos(angle * RAD), CY + r * Math.sin(angle * RAD)];
}

function polygonPoints(pos: CompassPosition, maxR = MAX_R): string {
  return RADAR_AXES.map(({ key, angle }) => {
    const r = maxR * (pos[key] + 1) / 2; // [-1,1] → [0, maxR]
    const [x, y] = pt(angle, r);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function gridPolygon(fraction: number): string {
  return RADAR_AXES.map(({ angle }) => {
    const [x, y] = pt(angle, MAX_R * fraction);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// ── Radar SVG ────────────────────────────────────────────────────────

function RadarChart({ userPos, mediaPos }: { userPos: CompassPosition; mediaPos: CompassPosition }) {
  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[260px] mx-auto select-none" aria-hidden="true">
      {/* Grille à 25%, 50%, 75%, 100% */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={gridPolygon(f)}
          fill="none" stroke="#374151" strokeWidth={f === 1 ? 0.75 : 0.4} />
      ))}

      {/* Lignes d'axe depuis le centre */}
      {RADAR_AXES.map(({ angle, key }) => {
        const [x2, y2] = pt(angle, MAX_R);
        return <line key={key} x1={CX} y1={CY} x2={x2} y2={y2} stroke="#374151" strokeWidth="0.5" />;
      })}

      {/* Polygone médias (indigo) */}
      <polygon points={polygonPoints(mediaPos)}
        fill="#818cf8" fillOpacity="0.12"
        stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.7" />

      {/* Polygone utilisateur (ambre) */}
      <polygon points={polygonPoints(userPos)}
        fill="#F5B731" fillOpacity="0.18"
        stroke="#F5B731" strokeWidth="2" />

      {/* Étiquettes aux sommets */}
      {RADAR_AXES.map(({ key, angle, posLabel }) => {
        const gap = Math.abs(userPos[key] - mediaPos[key]);
        const color = gap > 0.5 ? '#F97316' : gap > 0.3 ? '#FCD34D' : '#9CA3AF';
        const [lx, ly] = pt(angle, LABEL_R);
        // Ancrage selon position
        const anchor = lx < CX - 5 ? 'end' : lx > CX + 5 ? 'start' : 'middle';
        return (
          <text key={key} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize="8.5" fill={color} fontWeight="500">
            {posLabel}
          </text>
        );
      })}

      {/* Légende */}
      <g transform="translate(4, 246)">
        <rect x="0" y="0" width="10" height="10" fill="#F5B731" fillOpacity="0.5" stroke="#F5B731" strokeWidth="1" rx="2" />
        <text x="13" y="8" fontSize="7.5" fill="#9CA3AF">Toi</text>
        <rect x="38" y="0" width="10" height="10" fill="#818cf8" fillOpacity="0.3" stroke="#818cf8" strokeWidth="1" rx="2" />
        <text x="51" y="8" fontSize="7.5" fill="#9CA3AF">Tes sources</text>
      </g>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function avg(vals: number[]) { return vals.reduce((s, v) => s + v, 0) / vals.length; }

function gapInterpretation(key: keyof CompassPosition, gap: number): string {
  const axisInfo = AXES[key];
  if (Math.abs(gap) < 0.3) return '';
  const sourceTend = gap > 0 ? axisInfo.negative : axisInfo.positive;
  const userTend = gap > 0 ? axisInfo.positive : axisInfo.negative;
  return `Tu te positionnes plutôt "${userTend}", tes sources tendent vers "${sourceTend}"`;
}

const DIVERSITY_DISPLAY: Record<string, { label: string; color: string }> = {
  regularly: { label: 'Tu cherches activement des points de vue opposés', color: 'text-emerald-400' },
  sometimes: { label: 'Tu diversifies parfois tes sources', color: 'text-yellow-400' },
  rarely:    { label: 'Tu diversifies rarement tes sources', color: 'text-orange-400' },
  never:     { label: 'Tu n\'exposé(e) pas à des sources en désaccord', color: 'text-red-400' },
};

const RELATIONSHIP_DISPLAY: Record<string, { label: string; color: string }> = {
  trust:       { label: 'Tu te fies principalement aux grands médias', color: 'text-blue-400' },
  critical:    { label: 'Tu lis les grands médias avec recul critique', color: 'text-emerald-400' },
  independent: { label: 'Tu privilégies les médias indépendants', color: 'text-purple-400' },
  avoid:       { label: 'Tu évites les grands médias traditionnels', color: 'text-orange-400' },
};

// ── Composant principal ───────────────────────────────────────────────

interface MediaSourcesPanelProps {
  profile: UserProfile | null | undefined;
  userPosition: CompassPosition;
}

export function MediaSourcesPanel({ profile, userPosition }: MediaSourcesPanelProps) {
  const [mediaList, setMediaList] = useState<MediaWithPos[]>([]);

  // Charger la liste des médias avec positions si des IDs sont déclarés
  useEffect(() => {
    const hasSources = profile?.mediaSources && profile.mediaSources.length > 0;
    if (!hasSources) return;
    fetch('/api/medias')
      .then((r) => r.json())
      .then(setMediaList)
      .catch(() => {});
  }, [profile?.mediaSources?.join(',')]);

  // Si profil vide ou sans données v2 → ne pas afficher
  if (!profile?.infoFormats && !profile?.infoDiversity && !profile?.perceivedBias) return null;

  // Calcul de la position moyenne des médias déclarés
  const selected = profile.mediaSources?.length
    ? mediaList.filter((m) => profile.mediaSources!.includes(m.id))
    : [];

  const mediaAvgPos: CompassPosition | null = selected.length > 0 ? {
    societal:   avg(selected.map((m) => m.positionSocietal)),
    economic:   avg(selected.map((m) => m.positionEconomic)),
    authority:  avg(selected.map((m) => m.positionAuthority)),
    ecology:    avg(selected.map((m) => m.positionEcology)),
    sovereignty: avg(selected.map((m) => m.positionSovereignty)),
  } : null;

  // Calcul des écarts notables (|gap| > 0.3)
  const notableGaps = mediaAvgPos
    ? (Object.keys(userPosition) as Array<keyof CompassPosition>)
        .map((key) => ({
          key,
          gap: userPosition[key] - mediaAvgPos[key],
          absGap: Math.abs(userPosition[key] - mediaAvgPos[key]),
          interpretation: gapInterpretation(key, userPosition[key] - mediaAvgPos[key]),
        }))
        .filter((g) => g.absGap > 0.3)
        .sort((a, b) => b.absGap - a.absGap)
    : [];

  const highRisk = notableGaps.filter((g) => g.absGap > 0.5);
  const isLowDiversity = profile.infoDiversity === 'rarely' || profile.infoDiversity === 'never';

  const diversityInfo = profile.infoDiversity ? DIVERSITY_DISPLAY[profile.infoDiversity] : null;
  const relationshipInfo = profile.mediaRelationship ? RELATIONSHIP_DISPLAY[profile.mediaRelationship] : null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800 mb-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-400" aria-hidden="true" />
        Profil sources d'information
      </h3>

      {/* Radar si médias spécifiques déclarés et chargés */}
      {mediaAvgPos && selected.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-xs text-gray-500 text-center mb-2">
              Position éditoriale moyenne de tes {selected.length} source{selected.length > 1 ? 's' : ''} déclarée{selected.length > 1 ? 's' : ''}
            </p>
            <RadarChart userPos={userPosition} mediaPos={mediaAvgPos} />
          </div>

          {/* Axes avec écart notable */}
          {notableGaps.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Axes avec écart notable</p>
              {notableGaps.map(({ key, gap, absGap, interpretation }) => (
                <div key={key}
                  className={`rounded-lg px-3 py-2 text-xs ${
                    absGap > 0.5 && isLowDiversity
                      ? 'bg-orange-950/30 border border-orange-900/40'
                      : 'bg-gray-800/50 border border-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-medium text-gray-200">{AXES[key].negative} ↔ {AXES[key].positive}</span>
                    <span className={`text-[10px] font-mono ${absGap > 0.5 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      écart {gap > 0 ? '+' : ''}{gap.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-400">{interpretation}</p>
                  {absGap > 0.5 && isLowDiversity && (
                    <p className="text-orange-300 mt-1">
                      Angle mort potentiel — tu diversifies peu tes sources sur cet axe
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {notableGaps.length === 0 && (
            <p className="text-xs text-gray-500 text-center mb-4">
              Tes sources sont globalement alignées avec ton positionnement.
              {!isLowDiversity && " Tu diversifies tes sources — cohérent."}
            </p>
          )}

          {highRisk.length > 0 && !isLowDiversity && (
            <p className="text-xs text-emerald-400/80 mb-4 text-center">
              Les écarts importants que tu as peuvent être intentionnels — tu déclares diversifier tes sources.
            </p>
          )}
        </>
      )}

      {/* Si sources déclarées mais liste pas encore chargée */}
      {profile.mediaSources?.length && selected.length === 0 && mediaList.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-3 mb-2">Chargement de l'analyse...</p>
      )}

      {/* Si aucun média spécifique déclaré */}
      {(!profile.mediaSources || profile.mediaSources.length === 0) && (
        <p className="text-xs text-gray-600 italic mb-4">
          Tu n'as pas déclaré de médias spécifiques — le radar n'est pas disponible.
          Lance une nouvelle session pour les renseigner.
        </p>
      )}

      {/* Signaux comportementaux — toujours affichés */}
      <div className="space-y-2 border-t border-gray-800 pt-3">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Comportements déclarés</p>

        {diversityInfo && (
          <div className="flex items-start gap-2">
            <span className="text-gray-600 mt-0.5 text-xs shrink-0">→</span>
            <p className={`text-xs ${diversityInfo.color}`}>{diversityInfo.label}</p>
          </div>
        )}

        {profile.perceivedBias && (
          <div className="flex items-start gap-2">
            <span className="text-gray-600 mt-0.5 text-xs shrink-0">→</span>
            <p className="text-xs text-gray-400">
              Tu perçois tes sources comme{' '}
              <span className="text-gray-200">
                {profile.perceivedBias === 'gauche' && 'plutôt à gauche'}
                {profile.perceivedBias === 'droite' && 'plutôt à droite'}
                {profile.perceivedBias === 'varie' && 'variées (intentionnellement)'}
                {profile.perceivedBias === 'difficile' && 'difficiles à situer politiquement'}
              </span>
            </p>
          </div>
        )}

        {relationshipInfo && (
          <div className="flex items-start gap-2">
            <span className="text-gray-600 mt-0.5 text-xs shrink-0">→</span>
            <p className={`text-xs ${relationshipInfo.color}`}>{relationshipInfo.label}</p>
          </div>
        )}

        {/* Signal chambre d'écho combiné */}
        {isLowDiversity && profile.mediaRelationship === 'trust' && (
          <div className="mt-2 rounded-lg bg-orange-950/20 border border-orange-900/30 px-3 py-2">
            <p className="text-xs text-orange-300">
              Tu te fies principalement aux grands médias et tu diversifies peu —
              profil à risque de chambre d'écho institutionnelle.
            </p>
          </div>
        )}
        {isLowDiversity && profile.mediaRelationship === 'avoid' && (
          <div className="mt-2 rounded-lg bg-orange-950/20 border border-orange-900/30 px-3 py-2">
            <p className="text-xs text-orange-300">
              Tu évites les grands médias et tu diversifies peu —
              profil à risque de chambre d'écho dans des sources alternatives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
