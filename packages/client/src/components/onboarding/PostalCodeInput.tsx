import { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '@/App';

interface MediaItem {
  id: string;
  label: string;
  type: string;
  independent: boolean;
  editorialLabel: string | null;
}

interface PostalCodeInputProps {
  onSubmit: (data: UserProfile) => void;
  serverError?: string | null;
}

// ── Données statiques des questions ────────────────────────────────

const INFO_FORMATS = [
  { value: 'tv', label: 'Télévision', desc: 'TF1, BFM, CNews, France 2...' },
  { value: 'radio', label: 'Radio', desc: 'France Inter, RTL, Europe 1...' },
  { value: 'presse', label: 'Presse écrite / web', desc: 'Le Monde, Le Figaro, Mediapart...' },
  { value: 'podcast', label: 'Podcasts & YouTube', desc: 'Blast, Thinkerview, Hugo Décrypte...' },
  { value: 'reseaux', label: 'Réseaux sociaux', desc: 'X, TikTok, Instagram, Facebook...' },
  { value: 'entourage', label: 'Entourage & discussions', desc: 'Famille, amis, collègues...' },
  { value: 'autre', label: 'Autre / Pas de source principale', desc: '' },
];

const DIVERSITY_OPTIONS = [
  { value: 'regularly', label: 'Oui, régulièrement', desc: 'Je cherche activement des points de vue opposés' },
  { value: 'sometimes', label: 'Parfois', desc: 'Ça m\'arrive, sans en faire un principe' },
  { value: 'rarely', label: 'Rarement', desc: 'Plutôt par hasard que par choix' },
  { value: 'never', label: 'Non / jamais', desc: 'Je préfère les sources avec lesquelles je suis en accord' },
];

const PERCEIVED_BIASES = [
  { value: 'gauche', label: 'Plutôt à gauche' },
  { value: 'droite', label: 'Plutôt à droite' },
  { value: 'varie', label: 'Variées (j\'en cherche intentionnellement des différentes)' },
  { value: 'difficile', label: 'Difficile à dire / je ne sais pas' },
];

const MEDIA_RELATIONSHIP = [
  { value: 'trust', label: 'Je m\'y fie principalement', desc: 'Ce sont mes références habituelles' },
  { value: 'critical', label: 'Je les lis avec recul critique', desc: 'Je les suis mais je garde un œil critique' },
  { value: 'independent', label: 'Je préfère les médias indépendants', desc: 'J\'évite les grands groupes, je cherche ailleurs' },
  { value: 'avoid', label: 'Je les évite, trop proches du pouvoir', desc: 'Leur dépendance aux intérêts économiques ou politiques les disqualifie' },
];

const TYPE_LABELS: Record<string, string> = {
  tv: 'Télévision',
  radio: 'Radio',
  presse: 'Presse',
  podcast: 'Podcasts & YouTube',
  web: 'Web',
};
const TYPE_ORDER = ['tv', 'radio', 'presse', 'podcast', 'web'];

type ProfileStep = 'postal' | 'formats' | 'medias' | 'diversity' | 'bias' | 'relationship';
const QUESTION_STEPS: ProfileStep[] = ['formats', 'medias', 'diversity', 'bias', 'relationship'];

// ── Composant indicateur de progression ────────────────────────────

function QuestionHeader({ index, total, title, subtitle }: {
  index: number; total: number; title: string; subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Question {index} / {total}</span>
        <span>{Math.round((index / total) * 100)}%</span>
      </div>
      <div className="flex gap-1 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-all ${i < index ? 'bg-amber-500' : 'bg-gray-800'}`}
          />
        ))}
      </div>
      <h2 className="text-lg sm:text-xl font-bold mb-1 text-center">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm text-center">{subtitle}</p>}
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────

export function PostalCodeInput({ onSubmit, serverError }: PostalCodeInputProps) {
  const [step, setStep] = useState<ProfileStep>('postal');
  const [postalCode, setPostalCode] = useState('');
  const [infoFormats, setInfoFormats] = useState<string[]>([]);
  const [mediaSources, setMediaSources] = useState<string[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [infoDiversity, setInfoDiversity] = useState('');
  const [perceivedBias, setPerceivedBias] = useState('');
  const [error, setError] = useState(serverError || '');
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Erreur serveur → retour au code postal
  useEffect(() => {
    if (serverError) {
      setError(serverError);
      setStep('postal');
      setSubmitting(false);
    }
  }, [serverError]);

  // Charger la liste des médias à l'arrivée sur l'étape médias
  useEffect(() => {
    if (step === 'medias' && mediaList.length === 0 && !mediaLoading) {
      setMediaLoading(true);
      fetch('/api/medias')
        .then((r) => r.json())
        .then((data: MediaItem[]) => setMediaList(data))
        .catch(() => {})
        .finally(() => setMediaLoading(false));
    }
    if (step === 'medias') {
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [step]);

  const validatePostal = (val: string) => /^\d{5}$/.test(val);

  const qIndex = QUESTION_STEPS.indexOf(step) + 1; // 1-based pour l'affichage
  const totalQ = QUESTION_STEPS.length;

  const goTo = (s: ProfileStep) => { setError(''); setStep(s); };

  const toggleFormat = (val: string) =>
    setInfoFormats((p: string[]) => p.includes(val) ? p.filter((v: string) => v !== val) : [...p, val]);

  const toggleMedia = (id: string) =>
    setMediaSources((p: string[]) => p.includes(id) ? p.filter((v: string) => v !== id) : [...p, id]);

  const handleSubmit = (mediaRelationship: string) => {
    setSubmitting(true);
    onSubmit({ postalCode, infoFormats, mediaSources, infoDiversity, perceivedBias, mediaRelationship });
  };

  // Médias filtrés et groupés
  const filtered = mediaSearch.trim()
    ? mediaList.filter((m) => m.label.toLowerCase().includes(mediaSearch.toLowerCase()))
    : mediaList;

  const grouped = TYPE_ORDER.reduce<Record<string, MediaItem[]>>((acc, t) => {
    const items = filtered.filter((m) => m.type === t);
    if (items.length > 0) acc[t] = items;
    return acc;
  }, {});

  // ── Étape : Code postal ──────────────────────────────────────────
  if (step === 'postal') {
    return (
      <section className="max-w-md mx-auto text-center" aria-label="Code postal">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Avant de commencer</h2>
        <p className="text-gray-400 mb-6 text-sm sm:text-base">
          5 questions rapides pour enrichir l'analyse. Tout est anonyme.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <label htmlFor="postal-code" className="text-sm text-gray-400">Ton code postal</label>
          <input
            id="postal-code"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Ex : 75011"
            value={postalCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              setPostalCode(val);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && validatePostal(postalCode) && goTo('formats')}
            className="w-40 text-center text-2xl tracking-widest bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
            aria-describedby={error ? 'postal-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
            autoComplete="postal-code"
          />
          {error && <p id="postal-error" className="text-red-400 text-sm" role="alert">{error}</p>}
          <button
            onClick={() => {
              if (!validatePostal(postalCode)) {
                setError('Entre un code postal français à 5 chiffres, ou 99999 si tu es à l\'étranger.');
                return;
              }
              goTo('formats');
            }}
            disabled={postalCode.length < 5}
            className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors touch-target focus-ring"
          >
            Continuer
          </button>
          <p className="text-xs text-gray-600 mt-2">
            Si tu es à l'étranger, entre{' '}
            <button onClick={() => setPostalCode('99999')} className="text-amber-400 hover:text-amber-300 underline focus-ring rounded">
              99999
            </button>.
          </p>
        </div>
      </section>
    );
  }

  // ── Étape : Formats d'information ───────────────────────────────
  if (step === 'formats') {
    return (
      <section className="max-w-md mx-auto" aria-label="Formats d'information">
        <QuestionHeader
          index={qIndex} total={totalQ}
          title="Comment tu t'informes principalement ?"
          subtitle="Plusieurs choix possibles"
        />
        <ul className="flex flex-col gap-2" role="list">
          {INFO_FORMATS.map((f) => (
            <li key={f.value}>
              <button
                onClick={() => toggleFormat(f.value)}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-colors touch-target focus-ring flex justify-between items-start ${
                  infoFormats.includes(f.value)
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-amber-500/50'
                }`}
                aria-pressed={infoFormats.includes(f.value)}
              >
                <span>
                  <span className="font-medium">{f.label}</span>
                  {f.desc && <span className="text-sm text-gray-500 block mt-0.5">{f.desc}</span>}
                </span>
                {infoFormats.includes(f.value) && (
                  <span className="text-amber-500 ml-3 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between items-center">
          <button onClick={() => goTo('postal')} className="text-gray-500 hover:text-gray-300 text-sm focus-ring rounded px-2 py-1">
            ← Retour
          </button>
          <button
            onClick={() => goTo('medias')}
            disabled={infoFormats.length === 0}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors touch-target focus-ring"
          >
            Continuer {infoFormats.length > 0 && `(${infoFormats.length})`}
          </button>
        </div>
      </section>
    );
  }

  // ── Étape : Médias spécifiques (optionnel) ───────────────────────
  if (step === 'medias') {
    return (
      <section className="max-w-md mx-auto" aria-label="Médias spécifiques">
        <QuestionHeader
          index={qIndex} total={totalQ}
          title="Quels médias suis-tu régulièrement ?"
          subtitle="Optionnel — tu peux passer cette étape"
        />

        {/* Recherche */}
        <div className="relative mb-3">
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher un média..."
            value={mediaSearch}
            onChange={(e) => setMediaSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none pr-10"
            aria-label="Rechercher un média"
          />
          {mediaSearch && (
            <button
              onClick={() => setMediaSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>

        {/* Badges des médias sélectionnés */}
        {mediaSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {mediaSources.map((id) => {
              const m = mediaList.find((x) => x.id === id);
              return m ? (
                <button
                  key={id}
                  onClick={() => toggleMedia(id)}
                  className="text-xs px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 hover:bg-amber-500/30 transition-colors"
                  aria-label={`Retirer ${m.label}`}
                >
                  {m.label} ×
                </button>
              ) : null;
            })}
          </div>
        )}

        {/* Liste groupée avec scroll */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900" role="list">
          {mediaLoading && (
            <p className="text-gray-500 text-sm text-center py-6">Chargement...</p>
          )}
          {!mediaLoading && mediaList.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">Liste indisponible — tu peux passer cette étape.</p>
          )}
          {!mediaLoading && Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-950/50 sticky top-0">
                {TYPE_LABELS[type] ?? type}
              </div>
              {items.map((m) => {
                const selected = mediaSources.includes(m.id);
                return (
                  <button
                    key={m.id}
                    role="listitem"
                    onClick={() => toggleMedia(m.id)}
                    className={`w-full text-left px-3 py-2.5 flex justify-between items-start border-t border-gray-800/50 transition-colors focus-ring ${
                      selected ? 'bg-amber-500/10' : 'hover:bg-gray-800/50'
                    }`}
                    aria-pressed={selected}
                  >
                    <span>
                      <span className="text-sm font-medium">{m.label}</span>
                      {m.independent && (
                        <span className="ml-1.5 text-xs text-emerald-400/80">indép.</span>
                      )}
                      {m.editorialLabel && (
                        <span className="text-xs text-gray-500 block">{m.editorialLabel}</span>
                      )}
                    </span>
                    {selected && <span className="text-amber-500 ml-2 flex-shrink-0" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {!mediaLoading && mediaList.length > 0 && Object.keys(grouped).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Aucun résultat pour "{mediaSearch}"</p>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button onClick={() => goTo('formats')} className="text-gray-500 hover:text-gray-300 text-sm focus-ring rounded px-2 py-1">
            ← Retour
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => { setMediaSources([]); goTo('diversity'); }}
              className="px-4 py-2.5 text-gray-400 hover:text-gray-200 text-sm border border-gray-700 rounded-lg transition-colors focus-ring"
            >
              Passer
            </button>
            <button
              onClick={() => goTo('diversity')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
            >
              {mediaSources.length > 0 ? `Valider (${mediaSources.length})` : 'Continuer'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Étape : Diversité informationnelle ──────────────────────────
  if (step === 'diversity') {
    return (
      <section className="max-w-md mx-auto" aria-label="Diversité informationnelle">
        <QuestionHeader
          index={qIndex} total={totalQ}
          title="Il m'arrive de lire / écouter des sources avec lesquelles je suis globalement en désaccord"
        />
        <ul className="flex flex-col gap-2" role="list">
          {DIVERSITY_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => { setInfoDiversity(opt.value); goTo('bias'); }}
                className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-amber-500 transition-colors touch-target focus-ring"
              >
                <span className="font-medium block">{opt.label}</span>
                <span className="text-sm text-gray-500">{opt.desc}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <button onClick={() => goTo('medias')} className="text-gray-500 hover:text-gray-300 text-sm focus-ring rounded px-2 py-1">
            ← Retour
          </button>
        </div>
      </section>
    );
  }

  // ── Étape : Biais perçu ─────────────────────────────────────────
  if (step === 'bias') {
    return (
      <section className="max-w-md mx-auto" aria-label="Biais perçu">
        <QuestionHeader
          index={qIndex} total={totalQ}
          title="Dans l'ensemble, tes sources sont politiquement..."
        />
        <ul className="flex flex-col gap-2" role="list">
          {PERCEIVED_BIASES.map((b) => (
            <li key={b.value}>
              <button
                onClick={() => { setPerceivedBias(b.value); goTo('relationship'); }}
                className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-amber-500 transition-colors font-medium touch-target focus-ring"
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <button onClick={() => goTo('diversity')} className="text-gray-500 hover:text-gray-300 text-sm focus-ring rounded px-2 py-1">
            ← Retour
          </button>
        </div>
      </section>
    );
  }

  // ── Étape : Rapport aux médias mainstream ───────────────────────
  return (
    <section className="max-w-md mx-auto" aria-label="Rapport aux médias traditionnels">
      <QuestionHeader
        index={qIndex} total={totalQ}
        title="Ton rapport aux grands médias traditionnels (TV, presse nationale) ?"
      />
      <ul className="flex flex-col gap-2" role="list">
        {MEDIA_RELATIONSHIP.map((opt) => (
          <li key={opt.value}>
            <button
              disabled={submitting}
              onClick={() => handleSubmit(opt.value)}
              className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-amber-500 disabled:opacity-50 transition-colors touch-target focus-ring"
            >
              <span className="font-medium block">{opt.label}</span>
              <span className="text-sm text-gray-500">{opt.desc}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={() => goTo('bias')}
          disabled={submitting}
          className="text-gray-500 hover:text-gray-300 text-sm focus-ring rounded px-2 py-1"
        >
          ← Retour
        </button>
      </div>
    </section>
  );
}
