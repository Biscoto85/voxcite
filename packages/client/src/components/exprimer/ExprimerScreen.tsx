import { useState, useEffect, useCallback } from 'react';
import type { CompassPosition } from '@voxcite/shared';

interface ExprimerScreenProps {
  sessionId: string;
  userPosition: CompassPosition;
  onBack: () => void;
}

type Tab = 'programme' | 'proposer' | 'reagir';

interface DomainProgram {
  domainId: string;
  title: string;
  summary: string;
  proposals: string[];
}

interface ProgramVersion {
  generatedAt: string;
  evolutionSummary: string | null;
  totalProposals: number;
  totalContributors: number;
  isInitial: boolean;
  domains: DomainProgram[];
}

interface Suggestion {
  id: string;
  domainId: string;
  text: string;
}

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

const DOMAIN_IDS = Object.keys(DOMAIN_LABELS);

export function ExprimerScreen({ sessionId, userPosition, onBack }: ExprimerScreenProps) {
  const [tab, setTab] = useState<Tab>('programme');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">M'exprimer</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300">← Menu</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'programme' as Tab, label: 'Le programme' },
          { id: 'proposer' as Tab, label: 'Proposer' },
          { id: 'reagir' as Tab, label: 'Réagir' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'programme' && <ProgramTab />}
      {tab === 'proposer' && <ProposerTab sessionId={sessionId} userPosition={userPosition} />}
      {tab === 'reagir' && <ReagirTab sessionId={sessionId} userPosition={userPosition} />}
    </div>
  );
}

// ── Tab 1: Consulter le programme citoyen ──────────────────────────

function ProgramTab() {
  const [program, setProgram] = useState<ProgramVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/program/latest')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setProgram(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 text-center">Chargement...</p>;

  if (!program) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Le programme citoyen n'a pas encore été généré.</p>
        <p className="text-gray-500 text-sm mt-2">Il sera construit à partir des propositions des citoyens.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Evolution summary */}
      {program.evolutionSummary && (
        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-800/40 rounded-xl">
          <p className="text-sm text-purple-300 font-medium mb-1">
            {program.isInitial ? 'Version initiale' : 'Évolution du programme'}
          </p>
          <p className="text-sm text-gray-300">{program.evolutionSummary}</p>
          <p className="text-xs text-gray-500 mt-2">
            {program.totalContributors} contributeurs — {program.totalProposals} propositions —
            mis à jour le {new Date(program.generatedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}

      {/* Domains */}
      <div className="flex flex-col gap-2">
        {program.domains.map((d) => (
          <div key={d.domainId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedDomain(expandedDomain === d.domainId ? null : d.domainId)}
              className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800/50 transition-colors"
            >
              <div>
                <h3 className="font-medium">{d.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{d.summary}</p>
              </div>
              <span className="text-gray-500 text-sm ml-2">
                {d.proposals.length} prop.
              </span>
            </button>

            {expandedDomain === d.domainId && (
              <div className="px-4 pb-4 border-t border-gray-800">
                <ul className="mt-3 flex flex-col gap-2">
                  {d.proposals.map((p, i) => (
                    <li key={i} className="text-sm text-gray-300 pl-4 border-l-2 border-purple-600/50">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Proposer ────────────────────────────────────────────────

function ProposerTab({ sessionId, userPosition }: { sessionId: string; userPosition: CompassPosition }) {
  const [domain, setDomain] = useState(DOMAIN_IDS[0]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);

    try {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          domainId: domain,
          text: text.trim(),
          source: 'user',
          position: userPosition,
        }),
      });
      setSent(true);
      setText('');
      setTimeout(() => setSent(false), 2000);
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Rédige une proposition pour le programme citoyen. Elle sera intégrée
        à la synthèse collective.
      </p>

      {/* Domain selector */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 block mb-1">Thème</label>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          {DOMAIN_IDS.map((id) => (
            <option key={id} value={id}>{DOMAIN_LABELS[id]}</option>
          ))}
        </select>
      </div>

      {/* Proposal text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ex: Plafonner les loyers dans les zones tendues à un pourcentage du revenu médian local..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
        rows={4}
      />

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || sending}
        className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors"
      >
        {sending ? 'Envoi...' : sent ? 'Proposition envoyée !' : 'Soumettre ma proposition'}
      </button>

      {sent && (
        <p className="text-green-400 text-sm text-center mt-2">
          Merci ! Ta proposition sera intégrée au prochain programme.
        </p>
      )}
    </div>
  );
}

// ── Tab 3: Réagir (suggestions pré-générées) ──────────────────────

function ReagirTab({ sessionId, userPosition }: { sessionId: string; userPosition: CompassPosition }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetch(`/api/proposals/suggestions?sessionId=${sessionId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setSuggestions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const current = suggestions[currentIndex];

  const handleReact = async (reaction: 'ai_accepted' | 'ai_rejected' | 'ai_amended', amendedText?: string) => {
    if (!current) return;

    await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        domainId: current.domainId,
        text: amendedText || current.text,
        source: reaction,
        originalSuggestionId: current.id,
        position: userPosition,
      }),
    }).catch(() => {});

    setEditing(false);
    setEditText('');
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSuggestions([]);
    }
  };

  if (loading) return <p className="text-gray-500 text-center">Chargement...</p>;

  if (suggestions.length === 0 || !current) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Pas de suggestions pour l'instant.</p>
        <p className="text-gray-500 text-sm mt-2">
          De nouvelles suggestions adaptées à ton profil seront générées quotidiennement.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Voici des propositions adaptées à ton profil. Accepte, refuse ou amende.
      </p>

      <div className="text-xs text-gray-500 mb-2">
        {currentIndex + 1} / {suggestions.length} —
        <span className="ml-1">{DOMAIN_LABELS[current.domainId] || current.domainId}</span>
      </div>

      {/* Suggestion card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        {editing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
            rows={4}
          />
        ) : (
          <p className="text-gray-200">{current.text}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              onClick={() => handleReact('ai_amended', editText)}
              disabled={!editText.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Valider l'amendement
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(''); }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleReact('ai_accepted')}
              className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
            >
              Oui, j'approuve
            </button>
            <button
              onClick={() => { setEditing(true); setEditText(current.text); }}
              className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
            >
              Amender
            </button>
            <button
              onClick={() => handleReact('ai_rejected')}
              className="flex-1 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Non
            </button>
          </>
        )}
      </div>
    </div>
  );
}
