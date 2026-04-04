import { useState, useEffect } from 'react';
import type { CompassPosition } from '@voxcite/shared';

interface CritiqueScreenProps {
  sessionId: string;
  userPosition: CompassPosition;
  onBack: () => void;
}

type Tab = 'sources' | 'infos' | 'partager';

interface MediaSource {
  id: string;
  label: string;
  type: string;
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

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sources', label: 'Carte des sources' },
  { id: 'infos', label: 'Infos partagées' },
  { id: 'partager', label: 'Partager un lien' },
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
        Des infos et sources intéressantes pour élargir ton horizon.
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
            aria-controls={`critique-panel-${t.id}`}
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

      <div id={`critique-panel-${tab}`} role="tabpanel">
        {tab === 'sources' && <SourcesTab sessionId={sessionId} userPosition={userPosition} />}
        {tab === 'infos' && <InfosTab />}
        {tab === 'partager' && <PartagerTab sessionId={sessionId} />}
      </div>
    </section>
  );
}

// ── Tab 1: Carte des sources ──────────────────────────────────────

function SourcesTab({ sessionId, userPosition }: { sessionId: string; userPosition: CompassPosition }) {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingMedia, setRatingMedia] = useState<string | null>(null);
  const [ratingSoc, setRatingSoc] = useState(0);
  const [ratingEco, setRatingEco] = useState(0);

  useEffect(() => {
    fetch('/api/critique/medias')
      .then((r) => r.json())
      .then((data) => { setSources(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const submitRating = async (mediaId: string) => {
    await fetch(`/api/critique/medias/${mediaId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, societal: ratingSoc, economic: ratingEco }),
    }).catch(() => {});
    setRatingMedia(null);
    setRatingSoc(0);
    setRatingEco(0);
  };

  if (loading) return <p className="text-gray-500 text-center" role="status">Chargement...</p>;

  // Compute distance to user for sorting
  const withDistance = sources.map((s) => {
    const ds = s.position.societal - userPosition.societal;
    const de = s.position.economic - userPosition.economic;
    return { ...s, distance: Math.sqrt(ds * ds + de * de) };
  });

  // Group by type
  const byType = new Map<string, typeof withDistance>();
  for (const s of withDistance) {
    const list = byType.get(s.type) || [];
    list.push(s);
    byType.set(s.type, list);
  }

  // Sort each group by distance
  for (const list of byType.values()) {
    list.sort((a, b) => a.distance - b.distance);
  }

  // Gauge color: societal axis → red (conservateur) to blue (progressiste)
  const gaugeColor = (soc: number) => {
    const t = (soc + 1) / 2; // 0 to 1
    const r = Math.round(220 - t * 170);
    const g = Math.round(80 + (0.5 - Math.abs(t - 0.5)) * 100);
    const b = Math.round(50 + t * 170);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="flex flex-col gap-6">
      {['podcast', 'presse', 'tv', 'radio', 'web'].map((type) => {
        const list = byType.get(type);
        if (!list || list.length === 0) return null;
        return (
          <div key={type}>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {TYPE_LABELS[type] || type}
            </h3>
            <div className="flex flex-col gap-1.5">
              {list.map((s) => {
                const isClose = s.distance < 0.6;
                const isFar = s.distance > 1.2;
                return (
                  <div key={s.id}>
                    <button
                      className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors text-left touch-target focus-ring"
                      onClick={() => {
                        if (ratingMedia === s.id) { setRatingMedia(null); }
                        else { setRatingMedia(s.id); setRatingSoc(s.editorialPosition.societal); setRatingEco(s.editorialPosition.economic); }
                      }}
                      aria-expanded={ratingMedia === s.id}
                      aria-label={`${s.label} — ${s.editorialLabel}${isClose ? ' (proche de toi)' : ''}${isFar ? ' (éloigné)' : ''}`}
                    >
                      {/* Color gauge bar */}
                      <div
                        className="w-1.5 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: gaugeColor(s.position.societal) }}
                        aria-hidden="true"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{s.label}</span>
                          {isClose && <span className="text-xs text-green-400">proche de toi</span>}
                          {isFar && <span className="text-xs text-orange-400">éloigné</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{s.editorialLabel}</p>
                      </div>

                      {s.citizenRatingCount > 0 && (
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {s.citizenRatingCount} avis
                        </span>
                      )}
                    </button>

                    {/* Rating panel */}
                    {ratingMedia === s.id && (
                      <div className="ml-5 mt-1 p-3 bg-gray-800 rounded-lg border border-gray-700" role="form" aria-label={`Évaluer ${s.label}`}>
                        <p className="text-xs text-gray-400 mb-2">Selon toi, {s.label} est plutôt :</p>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                            <span>Conservateur</span>
                            <span>Progressiste</span>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            value={ratingSoc * 100}
                            onChange={(e) => setRatingSoc(Number(e.target.value) / 100)}
                            className="w-full accent-purple-500"
                            aria-label="Axe sociétal — de conservateur à progressiste"
                          />
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                            <span>Interventionniste</span>
                            <span>Libéral</span>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            value={ratingEco * 100}
                            onChange={(e) => setRatingEco(Number(e.target.value) / 100)}
                            className="w-full accent-purple-500"
                            aria-label="Axe économique — d'interventionniste à libéral"
                          />
                        </div>

                        <button
                          onClick={() => submitRating(s.id)}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium transition-colors touch-target focus-ring"
                        >
                          Envoyer mon évaluation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
      {/* Domain filter */}
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
