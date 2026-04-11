import { useState, useEffect, useRef, useCallback } from 'react';

interface CivicEvent {
  id: string;
  title: string;
  description: string;
  url: string | null;
  eventDate: string | null;
  location: string | null;
  organizer: string;
  category: string;
}

interface MobiliserScreenProps {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  petition: 'Pétition',
  atelier: 'Atelier',
  rencontre: 'Rencontre',
  formation: 'Formation',
  manifestation: 'Manifestation',
  autre: 'Initiative',
};

const CATEGORY_COLORS: Record<string, string> = {
  petition: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  atelier: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  rencontre: 'text-green-400 bg-green-400/10 border-green-400/20',
  formation: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  manifestation: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  autre: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const DOMAIN_OPTIONS = [
  { id: 'democratie', label: 'Démocratie et institutions' },
  { id: 'environnement', label: 'Environnement et écologie' },
  { id: 'economie', label: 'Économie et travail' },
  { id: 'sante', label: 'Santé et protection sociale' },
  { id: 'education', label: 'Éducation et jeunesse' },
  { id: 'numerique', label: 'Numérique et libertés' },
  { id: 'international', label: 'International et défense' },
  { id: 'securite', label: 'Sécurité et justice' },
];

const VALID_CATEGORIES = ['petition', 'atelier', 'rencontre', 'formation', 'manifestation', 'autre'];

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return null; }
}

// ── Carousel ─────────────────────────────────────────────────────────

function EventCarousel({ events, onPropose }: { events: CivicEvent[]; onPropose: () => void }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((i: number) => {
    setIndex(i);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((p) => (p + 1) % events.length), 6000);
  }, [events.length]);

  useEffect(() => {
    if (events.length === 0) return;
    timerRef.current = setInterval(() => setIndex((p) => (p + 1) % events.length), 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
        <p className="text-2xl mb-3">◇</p>
        <p className="text-gray-400 text-sm mb-4">
          Aucune initiative pour le moment.<br />Sois le premier à en proposer une !
        </p>
        <button
          onClick={onPropose}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-sm font-medium transition-colors focus-ring"
        >
          Proposer une initiative
        </button>
      </div>
    );
  }

  const ev = events[index];

  return (
    <div>
      {/* Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 min-h-[180px]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[ev.category] ?? CATEGORY_COLORS.autre}`}>
            {CATEGORY_LABELS[ev.category] ?? ev.category}
          </span>
          {ev.url && (
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 shrink-0 focus-ring rounded"
            >
              Voir ↗
            </a>
          )}
        </div>

        <h3 className="font-semibold text-white mb-1 leading-snug">{ev.title}</h3>
        <p className="text-sm text-gray-400 mb-3 leading-relaxed">{ev.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>— {ev.organizer}</span>
          {ev.location && <span>📍 {ev.location}</span>}
          {ev.eventDate && <span>📅 {formatDate(ev.eventDate)}</span>}
        </div>
      </div>

      {/* Dots + navigation */}
      {events.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => go((index - 1 + events.length) % events.length)}
            className="text-gray-600 hover:text-gray-400 px-2 py-1 focus-ring rounded text-xs"
            aria-label="Précédent"
          >
            ←
          </button>
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Événement ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-amber-400 w-4' : 'bg-gray-700 hover:bg-gray-500'}`}
            />
          ))}
          <button
            onClick={() => go((index + 1) % events.length)}
            className="text-gray-600 hover:text-gray-400 px-2 py-1 focus-ring rounded text-xs"
            aria-label="Suivant"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Propose event form ────────────────────────────────────────────────

function ProposeEventForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', url: '', eventDate: '',
    location: '', organizer: '', category: '', proposerEmail: '',
    nonPartisanAcknowledged: false,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nonPartisanAcknowledged) {
      setError('Tu dois confirmer le caractère non-partisan de l\'initiative.'); return;
    }
    setStatus('loading'); setError('');
    try {
      const res = await fetch('/api/mobiliser/events/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setStatus('success'); }
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'envoi.');
        setStatus('error');
      }
    } catch {
      setError('Erreur réseau. Réessaie plus tard.'); setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-gray-900 rounded-xl border border-green-900/40 p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-medium text-white mb-1">Proposition reçue !</p>
        <p className="text-sm text-gray-400 mb-4">
          Elle sera examinée par le bureau. Si elle est validée, elle apparaîtra dans le carrousel.
        </p>
        <button onClick={onClose} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded px-2 py-1">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-white">Proposer une initiative</h3>
        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-400 focus-ring rounded px-1">✕</button>
      </div>

      <div className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded-lg p-3 leading-relaxed">
        <strong>Canal non-partisan</strong> — Ce carrousel est réservé aux initiatives citoyennes
        sans affiliation partisane. Les initiatives directement ou indirectement liées à un parti,
        même pleinement légitimes, ne pourront pas y figurer.
      </div>

      <div className="grid gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Titre <span className="text-red-400">*</span></label>
          <input
            type="text" maxLength={120} required value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
            placeholder="Ex : Atelier budget participatif Lyon 7e"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Description <span className="text-red-400">*</span></label>
          <textarea
            maxLength={1000} required rows={3} value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring resize-none"
            placeholder="Décris l'initiative en 2-3 phrases."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Organisateur <span className="text-red-400">*</span></label>
            <input
              type="text" maxLength={200} required value={form.organizer}
              onChange={(e) => set('organizer', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
              placeholder="Association, collectif…"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Catégorie <span className="text-red-400">*</span></label>
            <select
              required value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
            >
              <option value="">—</option>
              {VALID_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Date (optionnel)</label>
            <input
              type="date" value={form.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Lieu (optionnel)</label>
            <input
              type="text" maxLength={200} value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
              placeholder="Ville, en ligne…"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Lien (optionnel)</label>
          <input
            type="url" maxLength={500} value={form.url}
            onChange={(e) => set('url', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Ton email (optionnel — pour qu'on te contacte)</label>
          <input
            type="email" maxLength={254} value={form.proposerEmail}
            onChange={(e) => set('proposerEmail', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-ring"
            placeholder="ne sera pas publié"
          />
        </div>

        <label className="flex gap-3 items-start cursor-pointer group">
          <input
            type="checkbox" required checked={form.nonPartisanAcknowledged}
            onChange={(e) => set('nonPartisanAcknowledged', e.target.checked)}
            className="mt-0.5 accent-amber-400 shrink-0"
          />
          <span className="text-xs text-gray-400 group-hover:text-gray-300">
            Je confirme que cette initiative est <strong className="text-white">non-partisane</strong> et
            n'est ni directement ni indirectement liée à un parti politique.
          </span>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors focus-ring"
      >
        {status === 'loading' ? 'Envoi…' : 'Envoyer la proposition'}
      </button>
    </form>
  );
}

// ── Newsletter form ───────────────────────────────────────────────────

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [unsubToken, setUnsubToken] = useState('');

  const toggleDomain = (id: string) =>
    setDomains((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setErrorMsg('Le consentement est obligatoire.'); return; }
    setStatus('loading'); setErrorMsg('');
    try {
      const res = await fetch('/api/mobiliser/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domains, consentGiven: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setUnsubToken(data.unsubscribeToken ?? '');
      } else {
        setErrorMsg(data.error || 'Erreur lors de l\'inscription.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Erreur réseau. Réessaie plus tard.'); setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-gray-900 rounded-xl border border-green-900/40 p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-medium text-white mb-2">Inscription confirmée !</p>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          Tu recevras des informations sur la mobilisation citoyenne non-partisane.
          Tu peux te désinscrire à tout moment.
        </p>
        {unsubToken && (
          <p className="text-xs text-gray-600 break-all">
            Lien de désinscription :{' '}
            <span className="text-gray-500">/api/mobiliser/newsletter/unsubscribe/{unsubToken}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-white mb-1">Rester informé·e</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Reçois des informations sur les initiatives citoyennes non-partisanes et les actualités
          de PartiPrism. Aucun lien avec ton profil politique — jamais.
        </p>
      </div>

      {/* Data protection notice */}
      <div className="bg-green-950/30 border border-green-900/40 rounded-lg p-3 text-xs text-gray-400 leading-relaxed">
        <strong className="text-green-400">Protection totale des données</strong><br />
        Ton email est stocké séparément et est <strong>sans lien possible avec ton positionnement politique</strong>,
        ton profil ou tes réponses. Il ne sera jamais vendu, partagé ou utilisé à d'autres fins.
        Tu peux te désinscrire à tout moment via un lien dans chaque email.
        Base légale : consentement explicite (art. 6.1.a RGPD).
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Adresse email <span className="text-red-400">*</span></label>
        <input
          type="email" required maxLength={254} value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus-ring"
          placeholder="ton@email.fr"
        />
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2">Centres d'intérêt <span className="text-gray-600">(optionnel — pour personnaliser)</span></p>
        <div className="grid grid-cols-2 gap-2">
          {DOMAIN_OPTIONS.map((d) => (
            <label key={d.id} className="flex gap-2 items-center cursor-pointer group">
              <input
                type="checkbox" checked={domains.includes(d.id)}
                onChange={() => toggleDomain(d.id)}
                className="accent-amber-400 shrink-0"
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex gap-3 items-start cursor-pointer group">
        <input
          type="checkbox" required checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-amber-400 shrink-0"
        />
        <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">
          J'accepte que mon email soit utilisé <strong className="text-white">uniquement</strong> pour
          recevoir des informations sur la mobilisation citoyenne non-partisane.
          Mon email ne sera <strong className="text-white">jamais</strong> lié à mon profil ou
          mes positions politiques. Je peux me désinscrire à tout moment.
        </span>
      </label>

      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

      <button
        type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors focus-ring"
      >
        {status === 'loading' ? 'Inscription…' : 'S\'inscrire'}
      </button>
    </form>
  );
}

// ── Main screen ───────────────────────────────────────────────────────

export function MobiliserScreen({ onBack }: MobiliserScreenProps) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showProposeForm, setShowProposeForm] = useState(false);

  useEffect(() => {
    fetch('/api/mobiliser/events')
      .then((r) => r.json())
      .then((data: CivicEvent[]) => { setEvents(data); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, []);

  return (
    <section className="max-w-lg mx-auto" aria-label="Me mobiliser">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Me mobiliser</h2>
        <button onClick={onBack} className="text-sm text-amber-400 hover:text-amber-300 focus-ring rounded py-1 px-2">
          ← Menu
        </button>
      </div>

      <div className="space-y-6">

        {/* Events carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Initiatives citoyennes
            </h3>
            {!showProposeForm && events.length > 0 && (
              <button
                onClick={() => setShowProposeForm(true)}
                className="text-xs text-amber-400 hover:text-amber-300 focus-ring rounded px-2 py-1"
              >
                + Proposer
              </button>
            )}
          </div>

          {loadingEvents
            ? <div className="h-40 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center">
                <p className="text-gray-600 text-sm" role="status">Chargement…</p>
              </div>
            : showProposeForm
              ? <ProposeEventForm onClose={() => setShowProposeForm(false)} />
              : <EventCarousel events={events} onPropose={() => setShowProposeForm(true)} />
          }

          {!showProposeForm && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed text-center">
              Ce canal est <strong className="text-gray-500">strictement non-partisan</strong>.
              Les initiatives directement ou indirectement liées à un parti politique ne pourront
              pas y figurer — non par hostilité, mais parce que ce canal se veut profondément
              apartisan.
            </p>
          )}
        </div>

        {/* Newsletter */}
        {!showProposeForm && <NewsletterSection />}

      </div>
    </section>
  );
}
