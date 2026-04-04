import { useState, useEffect } from 'react';
import type { CompassPosition } from '@partiprism/shared';

interface CritiqueScreenProps {
  sessionId: string;
  userPosition: CompassPosition;
  onBack: () => void;
}

type Tab = 'sources' | 'infos' | 'partager' | 'signaler';

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

const DOMAIN_LABELS: Record<string, string> = {
  travail: 'Travail et emploi',
  sante: 'Santé et protection sociale',
  education: 'Éducation et jeunesse',
  securite: 'Sécurité et justice',
  immigration: 'Immigration et identité',
  environnement: 'Environnement et énergie',
  economie: 'Économie et fiscalité',
  numerique: 'Numérique et libertés',
  democratie: 'Démocratie et institutions',
  international: 'International et défense',
};

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
  { id: 'infos', label: 'Infos partagées' },
  { id: 'partager', label: 'Partager' },
  { id: 'signaler', label: 'Média manquant' },
];

export function CritiqueScreen({ sessionId, userPosition, onBack }: CritiqueScreenProps) {
  const [tab, setTab] = useState<Tab>('sources');

  return (
    <section className="max-w-2xl mx-auto" aria-label="Esprit critique">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Esprit critique</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300 focus-ring rounded py-1 px-2">← Menu</button>
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
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sources' && <SourcesTab userPosition={userPosition} />}
      {tab === 'infos' && <InfosTab />}
      {tab === 'partager' && <PartagerTab sessionId={sessionId} />}
      {tab === 'signaler' && <SignalerMediaTab sessionId={sessionId} />}
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
              className="font-medium text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2 truncate"
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
            Tu es plutôt <span className="text-purple-300 font-medium">{userLabel}</span> sur cet axe.
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
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
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

// ── Tab 2: Infos partagées ──────────────────────────────────────────

function InfosTab() {
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 touch-target"
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
            className="block p-3 sm:p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-purple-600 transition-colors touch-target focus-ring"
          >
            <p className="text-sm text-gray-200">{l.description}</p>
            <div className="flex justify-between mt-1 flex-wrap gap-1">
              <span className="text-xs text-gray-500">{DOMAIN_LABELS[l.domainId] || l.domainId}</span>
              <span className="text-xs text-purple-400 truncate max-w-[200px]">{new URL(l.url).hostname}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Tab 3: Partager un lien ──────────────────────────────────────────

function PartagerTab({ sessionId }: { sessionId: string }) {
  const [domain, setDomain] = useState(Object.keys(DOMAIN_LABELS)[0]);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ status: string; description: string } | null>(null);

  const handleSubmit = async () => {
    if (!url.trim() || !description.trim()) return;
    setSending(true);

    try {
      const res = await fetch('/api/critique/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, domainId: domain, url: url.trim(), description: description.trim() }),
      });
      const data = await res.json();
      setResult(data);
      if (data.status === 'approved') {
        setUrl('');
        setDescription('');
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Partage un article, une vidéo ou un podcast en accès libre qui t'a marqué.
        La description sera vérifiée pour rester factuelle.
      </p>

      <div className="mb-3">
        <label htmlFor="partager-theme" className="text-xs text-gray-500 block mb-1">Thème</label>
        <select
          id="partager-theme"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 touch-target"
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          maxLength={200}
          aria-required="true"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!url.trim() || !description.trim() || sending}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
      >
        {sending ? 'Vérification en cours...' : 'Partager'}
      </button>

      {result && (
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

// ── Tab 4: Signaler un média manquant ────────────────────────────────

function SignalerMediaTab({ sessionId }: { sessionId: string }) {
  const [mediaName, setMediaName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('presse');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!mediaName.trim()) return;
    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          targetType: 'missing_media',
          feedbackType: 'missing_topic',
          description: `Média manquant: ${mediaName.trim()} (${TYPE_LABELS[mediaType] || mediaType})${mediaUrl.trim() ? ` — ${mediaUrl.trim()}` : ''}`,
          screen: 'critique',
        }),
      });
      setSent(true);
      setMediaName('');
      setMediaUrl('');
      setTimeout(() => setSent(false), 3000);
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Un média que tu suis régulièrement n'est pas dans la liste ?
        Signale-le et on l'ajoutera.
      </p>

      <div className="mb-3">
        <label htmlFor="media-name" className="text-xs text-gray-500 block mb-1">Nom du média</label>
        <input
          id="media-name"
          type="text"
          value={mediaName}
          onChange={(e) => setMediaName(e.target.value)}
          placeholder="Ex: Le Média, QG, Hugo Décrypte..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          aria-required="true"
          maxLength={100}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="media-url" className="text-xs text-gray-500 block mb-1">Lien (optionnel)</label>
        <input
          id="media-url"
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="media-type" className="text-xs text-gray-500 block mb-1">Type</label>
        <select
          id="media-type"
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 touch-target"
        >
          {Object.entries(TYPE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!mediaName.trim() || sending}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
      >
        {sending ? 'Envoi...' : 'Signaler ce média'}
      </button>

      {sent && (
        <p className="text-green-400 text-sm text-center mt-3" role="status" aria-live="polite">
          Merci ! On prendra en compte ta suggestion.
        </p>
      )}
    </div>
  );
}
