import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────

interface FeedbackRow {
  id: string;
  targetType: string;
  targetId: string | null;
  feedbackType: string;
  description: string;
  screen: string | null;
  processed: boolean;
  processedAt: string | null;
  createdAt: string;
}

interface MediaProposalRow {
  id: string;
  url: string;
  label: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface QGStats {
  feedback: { total: number; unprocessed: number };
  mediaProposals: { pending: number };
}

// ── Constants ──────────────────────────────────────────────────────

const SESSION_KEY = 'qg_token';

const SCREEN_LABELS: Record<string, string> = {
  menu: 'Menu', prisme: 'Prisme', affiner: 'Affiner',
  comparaison: 'Analyse IA', critique: 'Esprit critique',
  exprimer: "M'exprimer", reveal: 'Révélation', onboarding: 'Onboarding',
};

const TYPE_LABELS: Record<string, string> = {
  bias: 'Biais', formulation: 'Formulation',
  missing_topic: 'Thème manquant', other: 'Autre',
};

const TYPE_COLORS: Record<string, string> = {
  bias: 'bg-red-900/40 text-red-300 border-red-700/40',
  formulation: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  missing_topic: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  other: 'bg-gray-800 text-gray-400 border-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  approved: 'bg-green-900/40 text-green-300 border-green-700/40',
  rejected: 'bg-red-900/40 text-red-300 border-red-700/40',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── Sub-components ─────────────────────────────────────────────────

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${className}`}>
      {text}
    </span>
  );
}

// ── Login form ─────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/qg/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      sessionStorage.setItem(SESSION_KEY, data.token);
      onLogin(data.token);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-amber-400 mb-1">QG PartiPrism</h1>
        <p className="text-gray-500 text-sm mb-6">Espace board éditorial</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            autoFocus
            required
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Connexion…' : 'Accéder au QG'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Feedback tab ───────────────────────────────────────────────────

function FeedbackTab({ token }: { token: string }) {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterProcessed, setFilterProcessed] = useState<string>('false');
  const [filterScreen, setFilterScreen] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterProcessed !== '') params.set('processed', filterProcessed);
    if (filterScreen) params.set('screen', filterScreen);
    if (filterType) params.set('type', filterType);
    try {
      const res = await fetch(`/api/qg/feedback?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [token, page, filterProcessed, filterScreen, filterType]);

  useEffect(() => { load(); }, [load]);

  const toggleProcessed = async (id: string, current: boolean) => {
    await fetch(`/api/qg/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ processed: !current }),
    });
    load();
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterProcessed}
          onChange={(e) => { setFilterProcessed(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="false">Non traités</option>
          <option value="true">Traités</option>
          <option value="">Tous</option>
        </select>
        <select
          value={filterScreen}
          onChange={(e) => { setFilterScreen(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="">Tous les écrans</option>
          {Object.entries(SCREEN_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="ml-auto text-gray-500 text-sm self-center">{total} résultat{total > 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucun résultat.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className={`bg-gray-900 border rounded-xl p-4 ${row.processed ? 'border-gray-800 opacity-60' : 'border-gray-700'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {row.screen && (
                  <Badge
                    text={SCREEN_LABELS[row.screen] ?? row.screen}
                    className="bg-gray-800 text-gray-300 border-gray-700"
                  />
                )}
                <Badge
                  text={TYPE_LABELS[row.feedbackType] ?? row.feedbackType}
                  className={TYPE_COLORS[row.feedbackType] ?? TYPE_COLORS.other}
                />
                {row.targetType === 'question' && row.targetId && (
                  <Badge text={`Question : ${row.targetId}`} className="bg-indigo-900/40 text-indigo-300 border-indigo-700/40" />
                )}
                <span className="ml-auto text-gray-600 text-xs">{formatDate(row.createdAt)}</span>
              </div>
              <p className="text-sm text-white leading-relaxed mb-2">{row.description}</p>
              <button
                onClick={() => toggleProcessed(row.id, row.processed)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  row.processed
                    ? 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    : 'bg-green-900/40 text-green-300 hover:bg-green-800/40 border border-green-700/40'
                }`}
              >
                {row.processed ? '↩ Rouvrir' : '✓ Marquer traité'}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-gray-400 text-sm">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Media proposals tab ────────────────────────────────────────────

function MediaProposalsTab({ token }: { token: string }) {
  const [rows, setRows] = useState<MediaProposalRow[]>([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterStatus ? `?status=${filterStatus}` : '';
    try {
      const res = await fetch(`/api/qg/media-proposals${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/qg/media-proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterStatus === s ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {s === '' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvés' : 'Rejetés'}
          </button>
        ))}
        <span className="ml-auto text-gray-500 text-sm self-center">{rows.length} proposition{rows.length > 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucune proposition dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  text={row.status === 'pending' ? 'En attente' : row.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                  className={STATUS_COLORS[row.status] ?? STATUS_COLORS.pending}
                />
                <span className="font-medium text-sm text-white">{row.label}</span>
                <span className="ml-auto text-gray-600 text-xs">{formatDate(row.createdAt)}</span>
              </div>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 break-all block mb-2"
              >
                {row.url}
              </a>
              {row.notes && (
                <p className="text-xs text-gray-400 mb-2 bg-gray-800/60 rounded p-2">{row.notes}</p>
              )}
              {row.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(row.id, 'approved')}
                    disabled={updating === row.id}
                    className="px-3 py-1.5 bg-green-900/40 text-green-300 border border-green-700/40 rounded-lg text-xs hover:bg-green-800/40 transition-colors disabled:opacity-50"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => updateStatus(row.id, 'rejected')}
                    disabled={updating === row.id}
                    className="px-3 py-1.5 bg-red-900/40 text-red-300 border border-red-700/40 rounded-lg text-xs hover:bg-red-800/40 transition-colors disabled:opacity-50"
                  >
                    ✕ Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main QGPanel ───────────────────────────────────────────────────

export function QGPanel() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [tab, setTab] = useState<'feedback' | 'media'>('feedback');
  const [stats, setStats] = useState<QGStats | null>(null);

  const loadStats = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/qg/stats', { headers: { Authorization: `Bearer ${tok}` } });
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (token) loadStats(token);
  }, [token, loadStats]);

  const handleLogin = (tok: string) => {
    setToken(tok);
    loadStats(tok);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setStats(null);
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">QG PartiPrism</span>
          {stats && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="text-amber-300 font-medium">{stats.feedback.unprocessed} feedback{stats.feedback.unprocessed !== 1 ? 's' : ''} en attente</span>
              {stats.mediaProposals.pending > 0 && (
                <span className="text-indigo-300">{stats.mediaProposals.pending} médias à examiner</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Déconnexion
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-4">
        <div className="flex gap-0">
          {[
            { id: 'feedback' as const, label: 'Feedbacks', badge: stats?.feedback.unprocessed },
            { id: 'media' as const, label: 'Médias proposés', badge: stats?.mediaProposals.pending },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'feedback' && <FeedbackTab token={token} />}
        {tab === 'media' && <MediaProposalsTab token={token} />}
      </div>
    </div>
  );
}
