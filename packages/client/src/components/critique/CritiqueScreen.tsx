import { useState, useEffect } from 'react';
import type { CompassPosition } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import { MediaSourcesPanel } from '@/components/analysis/MediaSourcesPanel';
import type { UserProfile } from '@/App';

interface CritiqueScreenProps {
  userPosition: CompassPosition;
  profile?: UserProfile | null;
  domainLabels: Record<string, string>;
  onBack: () => void;
}

type Tab = 'sources' | 'biais' | 'infos' | 'partager' | 'signaler';

interface MediaSource {
  id: string;
  label: string;
  type: string;
  url: string | null;
  editorialLabel: string;
  owner: string;
  position: CompassPosition;
  editorialPosition: { societal: number; economic: number };
  citizenRatingCount: number;
}

interface SharedLink {
  id: string;
  domainId: string;
  url: string;
  description: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  tv: 'Télévision',
  radio: 'Radio',
  presse: 'Presse',
  web: 'Web',
  podcast: 'Podcasts / YouTube',
};

// DOMAIN_LABELS is now passed as prop from App (loaded from API)

type AxisId = keyof CompassPosition;

const AXIS_INFO: Record<AxisId, { label: string; negative: string; positive: string }> = {
  societal: { label: 'Sociétal', negative: 'Conservateur', positive: 'Progressiste' },
  economic: { label: 'Économique', negative: 'Interventionniste', positive: 'Libéral' },
  authority: { label: 'Autorité', negative: 'Autoritaire', positive: 'Libertaire' },
  ecology: { label: 'Écologie', negative: 'Productiviste', positive: 'Écologiste' },
  sovereignty: { label: 'Souveraineté', negative: 'Souverainiste', positive: 'Mondialiste' },
};

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sources', label: 'Tes médias' },
  { id: 'biais', label: 'Mes biais' },
  { id: 'infos', label: 'Infos partagées' },
  { id: 'partager', label: 'Partager' },
  { id: 'signaler', label: 'Média manquant' },
];

export function CritiqueScreen({ userPosition, profile, domainLabels, onBack }: CritiqueScreenProps) {
  const DOMAIN_LABELS = domainLabels;
  const [tab, setTab] = useState<Tab>('sources');
  const [proposeMediaUrl, setProposeMediaUrl] = useState('');

  const handleSuggestMedia = (url: string) => {
    setProposeMediaUrl(url);
    setTab('signaler');
  };

  return (
    <section className="max-w-2xl mx-auto" aria-label="Esprit critique">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Esprit critique</h2>
        <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">← Menu</button>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Découvre les médias proches de tes positions — et ceux qui peuvent élargir ton horizon.
      </p>

      {/* Tabs — scrollable on mobile */}
      <div
        className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Sections esprit critique"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-target focus-ring ${
              tab === t.id
                ? 'bg-amber-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sources' && <SourcesTab userPosition={userPosition} />}
      {tab === 'biais' && <BiaisTab userPosition={userPosition} profile={profile} />}
      {tab === 'infos' && <InfosTab domainLabels={DOMAIN_LABELS} />}
      {tab === 'partager' && <PartagerTab domainLabels={DOMAIN_LABELS} onSuggestMedia={handleSuggestMedia} />}
      {tab === 'signaler' && <ProposeMediaTab prefillUrl={proposeMediaUrl} />}
    </section>
  );
}

// ── Tab 1: Tes médias (par axe : le plus proche + à découvrir) ────

function MediaCard({ media, badge, badgeColor }: { media: MediaSource; badge: string; badgeColor: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {media.url ? (
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-amber-300 hover:text-amber-200 underline underline-offset-2 truncate"
            >
              {media.label}
            </a>
          ) : (
            <span className="font-medium text-sm truncate">{media.label}</span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {badge}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{media.editorialLabel}</p>
        <p className="text-xs text-gray-600 truncate">{TYPE_LABELS[media.type] || media.type} · {media.owner}</p>
      </div>
    </div>
  );
}

function SourcesTab({ userPosition }: { userPosition: CompassPosition }) {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/critique/medias')
      .then((r) => r.json())
      .then((data) => { setSources(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 text-center" role="status">Chargement...</p>;

  // For each axis: find closest and most distant (for discovery)
  const axisRecommendations = ALL_AXES.map((axis) => {
    const info = AXIS_INFO[axis];
    const userVal = userPosition[axis];

    // Sort by distance on this specific axis
    const sorted = [...sources]
      .filter((s) => s.id !== 'reseaux_sociaux') // exclude generic "social media"
      .map((s) => ({
        ...s,
        axisDist: Math.abs(s.position[axis] - userVal),
        axisVal: s.position[axis],
      }))
      .sort((a, b) => a.axisDist - b.axisDist);

    const closest = sorted[0] || null;

    // For discovery: pick the most distant that's on the other side of the axis
    // (if user is positive, suggest negative, and vice versa)
    const otherSide = sorted
      .filter((s) => {
        if (userVal >= 0) return s.axisVal < -0.1;
        return s.axisVal > 0.1;
      })
      .sort((a, b) => b.axisDist - a.axisDist);

    const discovery = otherSide[0] || sorted[sorted.length - 1] || null;

    // Where is the user on this axis?
    const userLabel = userVal > 0.2
      ? info.positive.toLowerCase()
      : userVal < -0.2
        ? info.negative.toLowerCase()
        : 'au centre';

    return { axis, info, userVal, userLabel, closest, discovery };
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-gray-500">
        Pour chaque axe politique, le média le plus proche de ta position et une suggestion pour élargir ta perspective.
      </p>

      {axisRecommendations.map(({ axis, info, userLabel, closest, discovery }) => (
        <div key={axis} className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{info.label}</h3>
            <span className="text-xs text-gray-500">
              {info.negative} ↔ {info.positive}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Tu es plutôt <span className="text-amber-300 font-medium">{userLabel}</span> sur cet axe.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {closest && (
              <MediaCard
                media={closest}
                badge="Proche de toi"
                badgeColor="bg-green-900/40 text-green-400"
              />
            )}
            {discovery && discovery.id !== closest?.id && (
              <MediaCard
                media={discovery}
                badge="À découvrir"
                badgeColor="bg-amber-900/40 text-amber-400"
              />
            )}
          </div>
        </div>
      ))}

      {/* Full list toggle */}
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
          Voir tous les {sources.length} médias référencés
        </summary>
        <div className="mt-3 flex flex-col gap-1.5">
          {sources
            .filter((s) => s.id !== 'reseaux_sociaux')
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <span className="text-gray-600">{TYPE_LABELS[s.type]?.slice(0, 2) || '?'}</span>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                    {s.label}
                  </a>
                ) : (
                  <span>{s.label}</span>
                )}
                <span className="text-gray-600 truncate">{s.editorialLabel}</span>
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}

// ── Tab 2: Mes biais (IA + profil sources) ─────────────────────────

interface CachedBias {
  category: 'media' | 'values';
  biasType: string;
  axis: string;
  description: string;
  strength: number;
  suggestedContent: string;
  suggestedSource?: string;
}

function BiaisTab({ userPosition, profile }: { userPosition: CompassPosition; profile?: UserProfile | null }) {
  const [biases, setBiases] = useState<CachedBias[]>([]);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('partiprism_analysis') || 'null');
      if (cached?.result?.biases) setBiases(cached.result.biases);
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="space-y-3">
      {/* Profil médias (radar + comportements) */}
      <MediaSourcesPanel profile={profile} userPosition={userPosition} />

      {/* Biais IA */}
      {biases.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
          <p className="text-gray-400">Analyse des biais non encore disponible.</p>
          <p className="text-sm text-gray-600 mt-1">Visite d'abord "Me situer" pour générer ton analyse.</p>
        </div>
      ) : (
        <>
          {(['media', 'values'] as const).map((cat) => {
            const catBiases = biases.filter((b) => b.category === cat);
            if (catBiases.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-wider mb-2 mt-2 flex items-center gap-2">
                  <span className={cat === 'media' ? 'text-blue-400' : 'text-amber-400'}>
                    {cat === 'media' ? 'Biais liés à tes sources d\'info' : 'Biais liés à tes valeurs'}
                  </span>
                </h3>
                {catBiases.map((bias, i) => {
                  const axisKey = bias.axis as keyof CompassPosition;
                  const axisInfo = AXES[axisKey];
                  return (
                    <article key={i} className={`rounded-xl p-4 border mb-2 ${
                      cat === 'media' ? 'bg-blue-950/20 border-blue-900/30' : 'bg-amber-950/20 border-amber-900/30'
                    }`}>
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <h4 className="font-medium text-sm">{bias.biasType.replace(/_/g, ' ')}</h4>
                        <div className="flex items-center gap-1.5">
                          {axisInfo && (
                            <span className="text-xs text-gray-500">{axisInfo.negative}↔{axisInfo.positive}</span>
                          )}
                          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden"
                            role="img" aria-label={`Intensité: ${Math.round(bias.strength * 100)}%`}>
                            <div
                              className={`h-full rounded-full ${cat === 'media' ? 'bg-blue-500' : 'bg-amber-500'}`}
                              style={{ width: `${bias.strength * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{bias.description}</p>
                      <p className="text-xs text-amber-400">{bias.suggestedContent}</p>
                      {bias.suggestedSource && (
                        <p className="text-xs text-gray-500 mt-1">
                          Source à explorer : <span className="text-gray-300">{bias.suggestedSource}</span>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Tab 3: Infos partagées ──────────────────────────────────────────

function InfosTab({ domainLabels: DOMAIN_LABELS }: { domainLabels: Record<string, string> }) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<string>('');

  useEffect(() => {
    const url = domain ? `/api/critique/links?domain=${domain}` : '/api/critique/links';
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setLinks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [domain]);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="infos-domain-filter" className="sr-only">Filtrer par thème</label>
        <select
          id="infos-domain-filter"
          value={domain}
          onChange={(e) => { setDomain(e.target.value); setLoading(true); }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 touch-target"
        >
          <option value="">Tous les thèmes</option>
          {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500 text-center" role="status">Chargement...</p>}

      {!loading && links.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          Aucune info partagée pour le moment. Sois le premier !
        </p>
      )}

      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 sm:p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-amber-500 transition-colors touch-target focus-ring"
          >
            <p className="text-sm text-gray-200">{l.description}</p>
            <div className="flex justify-between mt-1 flex-wrap gap-1">
              <span className="text-xs text-gray-500">{DOMAIN_LABELS[l.domainId] || l.domainId}</span>
              <span className="text-xs text-amber-400 truncate max-w-[200px]">{new URL(l.url).hostname}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Tab 3: Partager un lien ──────────────────────────────────────────

function PartagerTab({ domainLabels: DOMAIN_LABELS, onSuggestMedia }: {
  domainLabels: Record<string, string>;
  onSuggestMedia: (url: string) => void;
}) {
  const [domain, setDomain] = useState(Object.keys(DOMAIN_LABELS)[0]);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ status: string; description?: string; error?: string; domain?: string; message?: string } | null>(null);

  const handleSubmit = async () => {
    if (!url.trim() || !description.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/critique/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: domain, url: url.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (res.status === 422 && data.error === 'domain_not_whitelisted') {
        setResult(data);
      } else {
        setResult(data);
        if (data.status === 'approved') {
          setUrl('');
          setDescription('');
        }
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Partage un article d'un <strong className="text-white">média référencé</strong> en accès libre qui t'a marqué.
        La description sera vérifiée pour rester factuelle.
      </p>

      <div className="mb-3">
        <label htmlFor="partager-theme" className="text-xs text-gray-500 block mb-1">Thème</label>
        <select
          id="partager-theme"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 touch-target"
        >
          {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="partager-url" className="text-xs text-gray-500 block mb-1">Lien (URL)</label>
        <input
          id="partager-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          aria-required="true"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="partager-desc" className="text-xs text-gray-500 block mb-1">Description (1 phrase)</label>
        <input
          id="partager-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Enquête sur le coût réel de l'énergie nucléaire en France"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          maxLength={200}
          aria-required="true"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!url.trim() || !description.trim() || sending}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
      >
        {sending ? 'Vérification en cours...' : 'Partager'}
      </button>

      {result && result.error === 'domain_not_whitelisted' && (
        <div className="mt-3 p-4 rounded-lg bg-amber-950/30 border border-amber-800/40 text-sm" role="status" aria-live="polite">
          <p className="text-amber-300 font-medium mb-1">Domaine non référencé : {result.domain}</p>
          <p className="text-amber-400/80 text-xs mb-3">{result.message}</p>
          <button
            onClick={() => onSuggestMedia(url)}
            className="text-xs text-amber-400 underline hover:text-amber-300 focus-ring rounded"
          >
            → Proposer ce média au board
          </button>
        </div>
      )}

      {result && !result.error && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm ${
            result.status === 'approved' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}
          role="status"
          aria-live="polite"
        >
          {result.status === 'approved'
            ? `Lien publié ! Description : "${result.description}"`
            : 'Ce lien a été refusé (hors sujet ou contenu inapproprié).'
          }
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Proposer un nouveau média ─────────────────────────────────

function ProposeMediaTab({ prefillUrl = '' }: { prefillUrl?: string }) {
  const [url, setUrl] = useState(prefillUrl);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url.trim() || !label.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/critique/medias/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), label: label.trim(), notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setUrl('');
        setLabel('');
        setNotes('');
        setTimeout(() => setSent(false), 4000);
      } else {
        setError(data.error || 'Erreur lors de la soumission.');
      }
    } catch {
      setError('Erreur réseau. Réessaie plus tard.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Un média de qualité que tu suis n'est pas dans notre liste référencée ?
        Propose-le — notre board l'examinera pour l'ajouter.
      </p>

      <div className="mb-3">
        <label htmlFor="propose-label" className="text-xs text-gray-500 block mb-1">Nom du média</label>
        <input
          id="propose-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Alternatives Économiques, Le Monde Diplomatique..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          aria-required="true"
          maxLength={100}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="propose-url" className="text-xs text-gray-500 block mb-1">Site web du média</label>
        <input
          id="propose-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          aria-required="true"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="propose-notes" className="text-xs text-gray-500 block mb-1">Pourquoi ce média mérite d'être référencé ? (optionnel)</label>
        <textarea
          id="propose-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Media indépendant, couvre bien les questions économiques..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 resize-none"
          maxLength={500}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!url.trim() || !label.trim() || sending}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
      >
        {sending ? 'Envoi...' : 'Proposer ce média'}
      </button>

      {error && (
        <p className="text-red-400 text-sm text-center mt-3" role="alert">{error}</p>
      )}

      {sent && (
        <div className="mt-3 p-3 rounded-lg bg-green-900/30 text-green-300 text-sm text-center" role="status" aria-live="polite">
          Proposition envoyée ! Notre board l'examinera prochainement.
        </div>
      )}
    </div>
  );
}
