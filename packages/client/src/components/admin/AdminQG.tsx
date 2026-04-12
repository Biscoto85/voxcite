import { useState, useEffect, useCallback } from 'react';

type Tab = 'dashboard' | 'snapshots' | 'prompts' | 'questions' | 'parties' | 'medias' | 'feedbacks' | 'proposals' | 'api-calls' | 'mobiliser';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'snapshots', label: 'Réponses' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'questions', label: 'Questions' },
  { id: 'parties', label: 'Partis' },
  { id: 'medias', label: 'Médias' },
  { id: 'feedbacks', label: 'Feedbacks' },
  { id: 'proposals', label: 'Propositions' },
  { id: 'api-calls', label: 'API Calls' },
  { id: 'mobiliser', label: 'Mobiliser' },
];

// ── Auth helper ─────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const creds = localStorage.getItem('partiprism_admin_creds');
  if (!creds) return {};
  return { Authorization: `Basic ${btoa(creds)}` };
}

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('partiprism_admin_creds');
    window.location.reload();
  }
  return res;
}

// ── Login ───────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    localStorage.setItem('partiprism_admin_creds', `${username}:${password}`);
    const res = await fetch('/api/admin/dashboard', {
      headers: { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
    });
    if (res.ok) {
      onLogin();
    } else {
      localStorage.removeItem('partiprism_admin_creds');
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 w-full max-w-sm">
        <h1 className="text-xl font-bold text-amber-400 mb-6 text-center">PartiPrism QG</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={handleSubmit} className="w-full py-2 bg-amber-500 hover:bg-amber-400 rounded-lg font-medium text-sm">
          Connexion
        </button>
      </div>
    </div>
  );
}

// ── Main Admin ──────────────────────────────────────────────────────

export function AdminQG() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('partiprism_admin_creds'));
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-amber-400">PartiPrism QG</h1>
        <button
          onClick={() => { localStorage.removeItem('partiprism_admin_creds'); setAuthed(false); }}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Déconnexion
        </button>
      </header>

      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'snapshots' && <SnapshotsTab />}
        {tab === 'prompts' && <PromptsTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'parties' && <PartiesTab />}
        {tab === 'medias' && <MediasTab />}
        {tab === 'feedbacks' && <FeedbacksTab />}
        {tab === 'proposals' && <ProposalsTab />}
        {tab === 'api-calls' && <ApiCallsTab />}
        {tab === 'mobiliser' && <MobiliserTab />}
      </div>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    adminFetch('/dashboard').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Snapshots', value: data.totals.snapshots },
          { label: 'Votes', value: data.totals.votes },
          { label: 'Propositions', value: data.totals.proposals },
          { label: 'Feedbacks', value: data.totals.feedbacks },
          { label: 'À traiter', value: data.totals.pendingFeedbacks, alert: data.totals.pendingFeedbacks > 0 },
          { label: 'Questions', value: data.totals.questions },
        ].map((s) => (
          <div key={s.label} className={`bg-gray-900 rounded-xl p-4 border ${s.alert ? 'border-amber-500' : 'border-gray-800'}`}>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Coût API aujourd'hui</h3>
          <p className="text-xl font-bold">${(data.apiCosts.today.totalCost || 0).toFixed(4)}</p>
          <p className="text-xs text-gray-500">{data.apiCosts.today.totalCalls} appels</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Coût API cette semaine</h3>
          <p className="text-xl font-bold">${(data.apiCosts.week.totalCost || 0).toFixed(4)}</p>
          <p className="text-xs text-gray-500">{data.apiCosts.week.totalCalls} appels · {((data.apiCosts.week.totalInputTokens || 0) / 1000).toFixed(0)}K in · {((data.apiCosts.week.totalOutputTokens || 0) / 1000).toFixed(0)}K out</p>
        </div>
      </div>

      {data.dailySnapshots.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">Snapshots / jour (7 derniers jours)</h3>
          <div className="flex items-end gap-1 h-24">
            {data.dailySnapshots.map((d: any) => {
              const max = Math.max(...data.dailySnapshots.map((x: any) => x.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{d.count}</span>
                  <div className="w-full bg-amber-500/60 rounded-sm" style={{ height: `${h}%`, minHeight: 2 }} />
                  <span className="text-[8px] text-gray-600">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Snapshots (Réponses) ────────────────────────────────────────────

function SnapshotsTab() {
  const [data, setData] = useState<{ rows: any[]; pagination: any }>({ rows: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt');
  const [dir, setDir] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch(`/snapshots?page=${page}&limit=50&sort=${sort}&dir=${dir}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, sort, dir]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (col: string) => {
    if (sort === col) {
      setDir(dir === 'desc' ? 'asc' : 'desc');
    } else {
      setSort(col);
      setDir('desc');
    }
    setPage(1);
  };

  const sortIcon = (col: string) => sort === col ? (dir === 'desc' ? ' ↓' : ' ↑') : '';

  const handleExport = async () => {
    const res = await adminFetch(`/snapshots/export?sort=${sort}&dir=${dir}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partiprism-snapshots-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { pagination: pg } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Réponses ({pg.total})</h2>
        <button onClick={handleExport} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded text-xs font-medium text-black">
          Exporter CSV
        </button>
      </div>

      {loading && <p className="text-gray-500 text-center">Chargement...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('createdAt')}>Date{sortIcon('createdAt')}</th>
              <th className="text-left py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('postalCode')}>CP{sortIcon('postalCode')}</th>
              <th className="text-left py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('infoSource')}>Source{sortIcon('infoSource')}</th>
              <th className="text-right py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('societal')}>Soc{sortIcon('societal')}</th>
              <th className="text-right py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('economic')}>Éco{sortIcon('economic')}</th>
              <th className="text-right py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('authority')}>Aut{sortIcon('authority')}</th>
              <th className="text-right py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('ecology')}>Écol{sortIcon('ecology')}</th>
              <th className="text-right py-2 px-1.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort('sovereignty')}>Souv{sortIcon('sovereignty')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-900 hover:bg-gray-900/50">
                <td className="py-1.5 px-1.5 text-gray-400">{new Date(r.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="py-1.5 px-1.5 text-white font-mono">{r.postalCode || '-'}</td>
                <td className="py-1.5 px-1.5 text-gray-400">{r.infoSource || '-'}</td>
                <td className={`py-1.5 px-1.5 text-right ${r.positionSocietal > 0 ? 'text-cyan-400' : r.positionSocietal < 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.positionSocietal.toFixed(2)}</td>
                <td className={`py-1.5 px-1.5 text-right ${r.positionEconomic > 0 ? 'text-cyan-400' : r.positionEconomic < 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.positionEconomic.toFixed(2)}</td>
                <td className={`py-1.5 px-1.5 text-right ${r.positionAuthority > 0 ? 'text-cyan-400' : r.positionAuthority < 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.positionAuthority.toFixed(2)}</td>
                <td className={`py-1.5 px-1.5 text-right ${r.positionEcology > 0 ? 'text-cyan-400' : r.positionEcology < 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.positionEcology.toFixed(2)}</td>
                <td className={`py-1.5 px-1.5 text-right ${r.positionSovereignty > 0 ? 'text-cyan-400' : r.positionSovereignty < 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.positionSovereignty.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pg.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-gray-800 rounded text-xs disabled:opacity-30 hover:bg-gray-700"
          >
            ← Précédent
          </button>
          <span className="text-xs text-gray-500">
            Page {pg.page} / {pg.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pg.totalPages, p + 1))}
            disabled={page >= pg.totalPages}
            className="px-3 py-1.5 bg-gray-800 rounded text-xs disabled:opacity-30 hover:bg-gray-700"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Prompts ──────────────────────────────────────────────────────────

function PromptsTab() {
  const [allPrompts, setAllPrompts] = useState<any[]>([]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testModel, setTestModel] = useState('claude-sonnet-4-6');

  const load = () => adminFetch('/prompts').then((r) => r.json()).then(setAllPrompts).catch(() => {});
  useEffect(() => { load(); }, []);

  const grouped = new Map<string, any[]>();
  for (const p of allPrompts) {
    const list = grouped.get(p.key) || [];
    list.push(p);
    grouped.set(p.key, list);
  }

  const handleSave = async () => {
    if (!editKey || !editContent) return;
    await adminFetch('/prompts', {
      method: 'POST',
      body: JSON.stringify({ key: editKey, label: editLabel, content: editContent }),
    });
    setEditKey(null);
    load();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestOutput('');
    try {
      const res = await adminFetch('/prompts/test', {
        method: 'POST',
        body: JSON.stringify({ content: editContent, model: testModel }),
      });
      const data = await res.json();
      setTestOutput(data.output || data.error || 'No output');
    } catch (err: any) {
      setTestOutput('Error: ' + err.message);
    }
    setTesting(false);
  };

  const handleActivate = async (id: string) => {
    await adminFetch(`/prompts/${id}/activate`, { method: 'PUT' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Prompts IA</h2>
        <div className="flex gap-2">
          {([
            { key: 'analysis', label: '+ Analyse Haiku' },
            { key: 'analysis_deep', label: '+ Analyse Sonnet' },
            { key: 'program', label: '+ Programme' },
            { key: 'link_validation', label: '+ Validation' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                const active = allPrompts.find((p) => p.key === key && p.isActive);
                setEditKey(key);
                setEditLabel(active?.label || key);
                setEditContent(active?.content || '');
                setTestOutput('');
              }}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {editKey && (
        <div className="bg-gray-900 rounded-xl p-4 border border-amber-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-amber-400">Éditer: {editKey}</h3>
            <button onClick={() => setEditKey(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Label"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-white font-mono min-h-[300px] resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black">
              Sauvegarder (nouvelle version)
            </button>
            <select
              value={testModel}
              onChange={(e) => setTestModel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-xs text-white"
            >
              <option value="claude-sonnet-4-6">Sonnet (~2¢)</option>
              <option value="claude-haiku-4-5-20251001">Haiku (~0.5¢)</option>
            </select>
            <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              {testing ? 'Test en cours...' : 'Tester'}
            </button>
          </div>
          {testOutput && (
            <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-auto max-h-60 whitespace-pre-wrap">{testOutput}</pre>
          )}
        </div>
      )}

      {/* Versions list */}
      {[...grouped.entries()].map(([key, versions]) => (
        <div key={key} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="font-medium text-white mb-2">{key}</h3>
          <div className="space-y-1">
            {versions.map((p) => (
              <div key={p.id} className={`flex items-center justify-between text-xs py-1 px-2 rounded ${p.isActive ? 'bg-amber-900/20 border border-amber-800/30' : ''}`}>
                <span className="text-gray-400">
                  v{p.version} — {p.label} — {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                  {p.createdBy && ` par ${p.createdBy}`}
                </span>
                <div className="flex items-center gap-2">
                  {p.isActive ? (
                    <span className="text-amber-400 text-[10px]">ACTIF</span>
                  ) : (
                    <button onClick={() => handleActivate(p.id)} className="text-gray-500 hover:text-amber-400 text-[10px]">
                      Activer
                    </button>
                  )}
                  <button
                    onClick={() => { setEditKey(key); setEditLabel(p.label); setEditContent(p.content); setTestOutput(''); }}
                    className="text-gray-500 hover:text-white text-[10px]"
                  >
                    Éditer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {allPrompts.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucun prompt enregistré. Utilisez les boutons ci-dessus pour créer le premier.</p>
      )}
    </div>
  );
}

// ── Questions ────────────────────────────────────────────────────────

function QuestionsTab() {
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPolarity, setEditPolarity] = useState<number>(1);
  const [polarityChanged, setPolarityChanged] = useState(false);

  useEffect(() => {
    adminFetch('/questions').then((r) => r.json()).then(setAllQuestions).catch(() => {});
  }, []);

  const filtered = filter
    ? allQuestions.filter((q) => q.phase === filter || q.axis === filter || q.domainId === filter)
    : allQuestions;

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setEditText(q.text);
    setEditPolarity(q.polarity);
    setPolarityChanged(false);
  };

  const handleSave = async (id: string, originalPolarity: number) => {
    const body: Record<string, any> = { text: editText };
    if (editPolarity !== originalPolarity) body.polarity = editPolarity;
    await adminFetch(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setAllQuestions((prev) => prev.map((q) => q.id === id ? { ...q, text: editText, polarity: editPolarity } : q));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Questions ({allQuestions.length})</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="">Toutes</option>
            <option value="onboarding">Onboarding</option>
            <option value="deep">Deep</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Modifier le texte n'affecte pas les scores passés (stockés dans les snapshots).
        Modifier la polarité change l'interprétation des votes futurs.
      </p>

      <div className="space-y-2">
        {filtered.map((q) => (
          <div key={q.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {editingId === q.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white resize-none"
                      rows={3}
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-400">Polarité :</label>
                      <select
                        value={editPolarity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEditPolarity(val);
                          setPolarityChanged(val !== q.polarity);
                        }}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value={1}>+1 (D'accord → pôle positif)</option>
                        <option value={-1}>-1 (D'accord → pôle négatif)</option>
                      </select>
                      {polarityChanged && (
                        <span className="text-xs text-amber-400">⚠ Affecte les votes futurs</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(q.id, q.polarity)} className="px-3 py-1 bg-amber-500 rounded text-xs text-black font-medium">Sauver</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-700 rounded text-xs">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200 cursor-pointer hover:text-white" onClick={() => startEdit(q)}>
                    {q.text}
                  </p>
                )}
                <div className="flex gap-2 mt-1 text-[10px] text-gray-600">
                  <span>{q.phase}</span>
                  <span>axe: {q.axis}</span>
                  <span className={q.polarity > 0 ? 'text-green-700' : 'text-red-700'}>
                    polarité: {q.polarity > 0 ? '+1' : '-1'}
                  </span>
                  <span>domaine: {q.domainId}</span>
                  <span>poids: {q.weight}</span>
                  {q.voteCount > 0 && <span className="text-amber-400">{q.voteCount} votes (moy: {q.voteAvg?.toFixed(1)})</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feedbacks ────────────────────────────────────────────────────────

function FeedbacksTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showProcessed, setShowProcessed] = useState(false);

  const load = () => {
    adminFetch(`/feedbacks?processed=${showProcessed}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  };
  useEffect(load, [showProcessed]);

  const handleProcess = async (id: string) => {
    await adminFetch(`/feedbacks/${id}/process`, { method: 'PUT' });
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Feedbacks ({items.length})</h2>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={showProcessed} onChange={() => setShowProcessed(!showProcessed)} />
          Voir traités
        </label>
      </div>

      {items.length === 0 && <p className="text-gray-500 text-center py-8">Aucun feedback en attente.</p>}

      <p className="text-xs text-gray-500">Aucun traitement automatique — le bouton "Traité" est la seule action.</p>

      {items.map((f) => (
        <div key={f.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-gray-200">{f.description}</p>
              <div className="flex gap-2 mt-1 text-[10px] text-gray-600">
                <span className="text-amber-400">{f.feedbackType}</span>
                <span>{f.targetType}</span>
                {f.targetId && <span className="text-blue-400">→ {f.targetId}</span>}
                {f.screen && <span>écran: {f.screen}</span>}
                <span>{new Date(f.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            {!f.processed && (
              <button onClick={() => handleProcess(f.id)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs shrink-0">
                Traité
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Proposals ────────────────────────────────────────────────────────

function ProposalsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState('');

  useEffect(() => {
    adminFetch('/proposals').then((r) => r.json()).then(setItems).catch(() => {});
  }, []);

  const handleBatch = async () => {
    setBatchRunning(true);
    setBatchResult('');
    try {
      const res = await adminFetch('/batch/program', { method: 'POST' });
      const data = await res.json();
      setBatchResult(data.message || data.error || 'Done');
    } catch (err: any) {
      setBatchResult('Error: ' + err.message);
    }
    setBatchRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Propositions ({items.length})</h2>
        <button onClick={handleBatch} disabled={batchRunning} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black disabled:opacity-50">
          {batchRunning ? 'Génération...' : 'Générer le programme'}
        </button>
      </div>
      {batchResult && <p className="text-sm text-amber-400">{batchResult}</p>}

      {items.map((p) => (
        <div key={p.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <p className="text-sm text-gray-200">{p.text}</p>
          <div className="flex gap-2 mt-1 text-[10px] text-gray-600">
            <span className="text-amber-400">{p.source}</span>
            <span>{p.domainId}</span>
            <span>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── API Calls ────────────────────────────────────────────────────────

function ApiCallsTab() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    adminFetch('/api-calls?limit=100').then((r) => r.json()).then(setItems).catch(() => {});
  }, []);

  const totalCost = items.reduce((s, c) => s + (c.costEstimate || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Appels API ({items.length})</h2>
        <p className="text-sm text-amber-400">Coût total affiché : ${totalCost.toFixed(4)}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Prompt</th>
              <th className="text-left py-2 px-2">Modèle</th>
              <th className="text-right py-2 px-2">In</th>
              <th className="text-right py-2 px-2">Out</th>
              <th className="text-right py-2 px-2">Coût</th>
              <th className="text-right py-2 px-2">Durée</th>
              <th className="text-center py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-gray-900 hover:bg-gray-900/50">
                <td className="py-1.5 px-2 text-gray-400">{new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="py-1.5 px-2 text-white">{c.promptKey}</td>
                <td className="py-1.5 px-2 text-gray-400">{c.model.replace('claude-', '').slice(0, 15)}</td>
                <td className="py-1.5 px-2 text-right text-gray-400">{c.inputTokens || '-'}</td>
                <td className="py-1.5 px-2 text-right text-gray-400">{c.outputTokens || '-'}</td>
                <td className="py-1.5 px-2 text-right text-amber-400">${(c.costEstimate || 0).toFixed(4)}</td>
                <td className="py-1.5 px-2 text-right text-gray-400">{c.durationMs ? `${(c.durationMs / 1000).toFixed(1)}s` : '-'}</td>
                <td className="py-1.5 px-2 text-center">{c.success ? '✓' : <span className="text-red-400" title={c.errorMessage}>✗</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Axis slider helper ──────────────────────────────────────────────

const AXIS_NAMES = [
  { key: 'positionSocietal', label: 'Sociétal', neg: 'Conservateur', pos: 'Progressiste' },
  { key: 'positionEconomic', label: 'Économique', neg: 'Interventionniste', pos: 'Libéral' },
  { key: 'positionAuthority', label: 'Autorité', neg: 'Autoritaire', pos: 'Libertaire' },
  { key: 'positionEcology', label: 'Écologie', neg: 'Productiviste', pos: 'Écologiste' },
  { key: 'positionSovereignty', label: 'Souveraineté', neg: 'Souverainiste', pos: 'Mondialiste' },
];

function AxisSliders({ values, onChange }: {
  values: Record<string, any>;
  onChange: (key: string, val: number) => void;
}) {
  return (
    <div className="space-y-2">
      {AXIS_NAMES.map((a) => (
        <div key={a.key}>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{a.neg}</span>
            <span className="text-gray-400">{a.label}: {(values[a.key] ?? 0).toFixed(2)}</span>
            <span>{a.pos}</span>
          </div>
          <input
            type="range" min={-100} max={100}
            value={Math.round((values[a.key] ?? 0) * 100)}
            onChange={(e) => onChange(a.key, Number(e.target.value) / 100)}
            className="w-full accent-amber-500"
          />
        </div>
      ))}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Gauche</span>
          <span className="text-gray-400">1D: {(values.position1d ?? 0).toFixed(2)}</span>
          <span>Droite</span>
        </div>
        <input
          type="range" min={-100} max={100}
          value={Math.round((values.position1d ?? 0) * 100)}
          onChange={(e) => onChange('position1d', Number(e.target.value) / 100)}
          className="w-full accent-amber-500"
        />
      </div>
    </div>
  );
}

// ── Parties ──────────────────────────────────────────────────────────

function PartiesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [adding, setAdding] = useState(false);
  const [newParty, setNewParty] = useState({ id: '', label: '', abbreviation: '', color: '#3B82F6', leader: '', position1d: 0, positionSocietal: 0, positionEconomic: 0, positionAuthority: 0, positionEcology: 0, positionSovereignty: 0 });

  const load = () => adminFetch('/parties').then((r) => r.json()).then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async (id: string) => {
    await adminFetch(`/parties/${id}`, { method: 'PUT', body: JSON.stringify(editData) });
    setEditId(null);
    load();
  };

  const handleAdd = async () => {
    if (!newParty.id || !newParty.label || !newParty.abbreviation) return;
    await adminFetch('/parties', { method: 'POST', body: JSON.stringify(newParty) });
    setAdding(false);
    setNewParty({ id: '', label: '', abbreviation: '', color: '#3B82F6', leader: '', position1d: 0, positionSocietal: 0, positionEconomic: 0, positionAuthority: 0, positionEcology: 0, positionSovereignty: 0 });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Supprimer le parti "${id}" ?`)) return;
    await adminFetch(`/parties/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Partis ({items.length})</h2>
        <button onClick={() => setAdding(!adding)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded text-xs font-medium text-black">
          {adding ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {adding && (
        <div className="bg-gray-900 rounded-xl p-4 border border-amber-800/40 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input value={newParty.id} onChange={(e) => setNewParty({ ...newParty, id: e.target.value })} placeholder="ID (ex: udi)" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <input value={newParty.label} onChange={(e) => setNewParty({ ...newParty, label: e.target.value })} placeholder="Nom complet" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <input value={newParty.abbreviation} onChange={(e) => setNewParty({ ...newParty, abbreviation: e.target.value })} placeholder="Abréviation" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <div className="flex gap-1">
              <input type="color" value={newParty.color} onChange={(e) => setNewParty({ ...newParty, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
              <input value={newParty.leader} onChange={(e) => setNewParty({ ...newParty, leader: e.target.value })} placeholder="Leader" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            </div>
          </div>
          <AxisSliders values={newParty} onChange={(k, v) => setNewParty({ ...newParty, [k]: v })} />
          <button onClick={handleAdd} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black">Créer</button>
        </div>
      )}

      {items.map((p) => (
        <div key={p.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="font-medium">{p.abbreviation}</span>
              <span className="text-sm text-gray-400">{p.label}</span>
              {p.leader && <span className="text-xs text-gray-600">({p.leader})</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditId(editId === p.id ? null : p.id); setEditData(p); }} className="text-xs text-gray-500 hover:text-amber-400">
                {editId === p.id ? 'Fermer' : 'Éditer'}
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-600 hover:text-red-400">Suppr</button>
            </div>
          </div>

          {editId === p.id && (
            <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input value={editData.label} onChange={(e) => setEditData({ ...editData, label: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <input value={editData.abbreviation} onChange={(e) => setEditData({ ...editData, abbreviation: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <div className="flex gap-1">
                  <input type="color" value={editData.color} onChange={(e) => setEditData({ ...editData, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
                  <input value={editData.leader || ''} onChange={(e) => setEditData({ ...editData, leader: e.target.value })} placeholder="Leader" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                </div>
              </div>
              <AxisSliders values={editData} onChange={(k, v) => setEditData({ ...editData, [k]: v })} />
              <button onClick={() => handleSave(p.id)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black">Sauvegarder</button>
            </div>
          )}

          {editId !== p.id && (
            <div className="flex gap-3 text-[10px] text-gray-600 flex-wrap">
              {AXIS_NAMES.map((a) => (
                <span key={a.key}>{a.label}: {(p[a.key] ?? 0).toFixed(2)}</span>
              ))}
              <span>1D: {(p.position1d ?? 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Médias ───────────────────────────────────────────────────────────

function MediasTab() {
  const [data, setData] = useState<{ medias: any[]; missingMediaRequests: any[] }>({ medias: [], missingMediaRequests: [] });
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [adding, setAdding] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [newMedia, setNewMedia] = useState({ id: '', label: '', type: 'presse', url: '', owner: '', independent: false, editorialLabel: '', position1d: 0, positionSocietal: 0, positionEconomic: 0, positionAuthority: 0, positionEcology: 0, positionSovereignty: 0 });

  const load = () => adminFetch('/medias').then((r) => r.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = typeFilter ? data.medias.filter((m) => m.type === typeFilter) : data.medias;

  const handleSave = async (id: string) => {
    await adminFetch(`/medias/${id}`, { method: 'PUT', body: JSON.stringify(editData) });
    setEditId(null);
    load();
  };

  const handleAdd = async () => {
    if (!newMedia.id || !newMedia.label) return;
    await adminFetch('/medias', { method: 'POST', body: JSON.stringify(newMedia) });
    setAdding(false);
    setNewMedia({ id: '', label: '', type: 'presse', url: '', owner: '', independent: false, editorialLabel: '', position1d: 0, positionSocietal: 0, positionEconomic: 0, positionAuthority: 0, positionEcology: 0, positionSovereignty: 0 });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Supprimer le média "${id}" ?`)) return;
    await adminFetch(`/medias/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Médias ({data.medias.length})</h2>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
            <option value="">Tous</option>
            <option value="tv">TV</option>
            <option value="radio">Radio</option>
            <option value="presse">Presse</option>
            <option value="podcast">Podcast</option>
            <option value="web">Web</option>
          </select>
          <button onClick={() => setAdding(!adding)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded text-xs font-medium text-black">
            {adding ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {/* Missing media requests */}
      {data.missingMediaRequests.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Médias signalés manquants ({data.missingMediaRequests.length})</h3>
          {data.missingMediaRequests.map((f) => (
            <div key={f.id} className="text-xs text-gray-300 py-1 border-b border-gray-800 last:border-0">
              {f.description}
              <span className="text-gray-600 ml-2">{new Date(f.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-gray-900 rounded-xl p-4 border border-amber-800/40 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input value={newMedia.id} onChange={(e) => setNewMedia({ ...newMedia, id: e.target.value })} placeholder="ID (ex: hugo_decrypte)" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <input value={newMedia.label} onChange={(e) => setNewMedia({ ...newMedia, label: e.target.value })} placeholder="Nom" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <select value={newMedia.type} onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white">
              <option value="tv">TV</option><option value="radio">Radio</option><option value="presse">Presse</option><option value="podcast">Podcast</option><option value="web">Web</option>
            </select>
            <input value={newMedia.url} onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })} placeholder="URL" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <input value={newMedia.owner} onChange={(e) => setNewMedia({ ...newMedia, owner: e.target.value })} placeholder="Propriétaire" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
            <input value={newMedia.editorialLabel} onChange={(e) => setNewMedia({ ...newMedia, editorialLabel: e.target.value })} placeholder="Ligne éditoriale" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={newMedia.independent} onChange={(e) => setNewMedia({ ...newMedia, independent: e.target.checked })} />
            Indépendant
          </label>
          <AxisSliders values={newMedia} onChange={(k, v) => setNewMedia({ ...newMedia, [k]: v })} />
          <button onClick={handleAdd} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black">Créer</button>
        </div>
      )}

      {/* Media list */}
      {filtered.map((m) => (
        <div key={m.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 uppercase w-12">{m.type}</span>
              <span className="font-medium text-sm">{m.label}</span>
              {m.independent && <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">indép.</span>}
              <span className="text-xs text-gray-500">{m.editorialLabel}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditId(editId === m.id ? null : m.id); setEditData(m); }} className="text-xs text-gray-500 hover:text-amber-400">
                {editId === m.id ? 'Fermer' : 'Éditer'}
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-xs text-gray-600 hover:text-red-400">Suppr</button>
            </div>
          </div>

          {/* Citizen ratings summary */}
          {m.citizenStats && (
            <div className="text-[10px] text-gray-500 mb-1">
              {m.citizenStats.count} évaluations citoyennes — moy. soc: {m.citizenStats.avgSoc?.toFixed(2)} éco: {m.citizenStats.avgEco?.toFixed(2)}
              {m.citizenSocietal != null && (
                <span className="text-amber-400 ml-2">→ position blendée: soc={m.citizenSocietal.toFixed(2)} éco={m.citizenEconomic?.toFixed(2)}</span>
              )}
            </div>
          )}

          {editId === m.id && (
            <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <input value={editData.label} onChange={(e) => setEditData({ ...editData, label: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <select value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white">
                  <option value="tv">TV</option><option value="radio">Radio</option><option value="presse">Presse</option><option value="podcast">Podcast</option><option value="web">Web</option>
                </select>
                <input value={editData.url || ''} onChange={(e) => setEditData({ ...editData, url: e.target.value })} placeholder="URL" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <input value={editData.owner || ''} onChange={(e) => setEditData({ ...editData, owner: e.target.value })} placeholder="Propriétaire" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <input value={editData.editorialLabel || ''} onChange={(e) => setEditData({ ...editData, editorialLabel: e.target.value })} placeholder="Ligne éditoriale" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input type="checkbox" checked={editData.independent} onChange={(e) => setEditData({ ...editData, independent: e.target.checked })} />
                  Indépendant
                </label>
              </div>
              <AxisSliders values={editData} onChange={(k, v) => setEditData({ ...editData, [k]: v })} />
              <button onClick={() => handleSave(m.id)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded text-sm font-medium text-black">Sauvegarder</button>
            </div>
          )}

          {editId !== m.id && (
            <div className="flex gap-3 text-[10px] text-gray-600 flex-wrap">
              {AXIS_NAMES.map((a) => (
                <span key={a.key}>{a.label}: {(m[a.key] ?? 0).toFixed(2)}</span>
              ))}
              <span>1D: {(m.position1d ?? 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── MobiliserTab ────────────────────────────────────────────────────

function qgFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('qg_token');
  return fetch(`/api/qg${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers ?? {}) },
  });
}

interface EventProposal {
  id: string; title: string; description: string; url: string | null;
  eventDate: string | null; location: string | null; organizer: string;
  category: string; proposerEmail: string | null; status: string;
  rejectionReason: string | null; createdAt: string;
}

interface CivicEventAdmin {
  id: string; title: string; description: string; url: string | null;
  eventDate: string | null; location: string | null; organizer: string;
  category: string; isActive: boolean; createdAt: string;
}

const CATEGORY_LABELS_ADMIN: Record<string, string> = {
  petition: 'Pétition', atelier: 'Atelier', rencontre: 'Rencontre',
  formation: 'Formation', manifestation: 'Manifestation', autre: 'Autre',
};

function MobiliserTab() {
  const [proposals, setProposals] = useState<EventProposal[]>([]);
  const [events, setEvents] = useState<CivicEventAdmin[]>([]);
  const [newsletterStats, setNewsletterStats] = useState<{ active: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'proposals' | 'events'>('proposals');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', url: '', eventDate: '', location: '', organizer: '', category: 'autre', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    const [p, e, n] = await Promise.all([
      qgFetch('/event-proposals?status=pending').then((r) => r.json()),
      qgFetch('/events').then((r) => r.json()),
      qgFetch('/newsletter/stats').then((r) => r.json()),
    ]);
    setProposals(Array.isArray(p) ? p : []);
    setEvents(Array.isArray(e) ? e : []);
    setNewsletterStats(n.active != null ? n : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleProposal = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    await qgFetch(`/event-proposals/${id}`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason: rejectionReason ?? null }) });
    if (status === 'approved') {
      const p = proposals.find((x) => x.id === id);
      if (p) {
        await qgFetch('/events', { method: 'POST', body: JSON.stringify({ title: p.title, description: p.description, url: p.url, eventDate: p.eventDate, location: p.location, organizer: p.organizer, category: p.category, isActive: true }) });
      }
    }
    load();
  };

  const toggleEvent = async (id: string, isActive: boolean) => {
    await qgFetch(`/events/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
    load();
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await qgFetch('/events', { method: 'POST', body: JSON.stringify(newEvent) });
    setShowCreateForm(false);
    setNewEvent({ title: '', description: '', url: '', eventDate: '', location: '', organizer: '', category: 'autre', isActive: true });
    load();
  };

  const exportNewsletter = () => {
    const token = localStorage.getItem('qg_token');
    const url = `/api/qg/newsletter/export`;
    const a = document.createElement('a');
    a.href = url;
    if (token) a.href += `?token=${encodeURIComponent(token)}`;
    a.click();
  };

  if (loading) return <p className="text-gray-500 text-sm">Chargement…</p>;

  return (
    <div className="space-y-6">
      {/* Newsletter stats */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Newsletter</h3>
          <button onClick={exportNewsletter} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded focus-ring">
            Exporter CSV
          </button>
        </div>
        {newsletterStats && (
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">{newsletterStats.active}</span> abonnés actifs
            {' '}/ {newsletterStats.total} total
          </p>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setView('proposals')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'proposals' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
          Propositions ({proposals.length})
        </button>
        <button onClick={() => setView('events')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'events' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
          Événements ({events.length})
        </button>
      </div>

      {/* Proposals */}
      {view === 'proposals' && (
        <div className="space-y-3">
          {proposals.length === 0 && <p className="text-gray-500 text-sm">Aucune proposition en attente.</p>}
          {proposals.map((p) => (
            <div key={p.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase">{CATEGORY_LABELS_ADMIN[p.category] ?? p.category}</span>
                  <h4 className="font-medium text-white">{p.title}</h4>
                  <p className="text-sm text-gray-400">{p.organizer}</p>
                </div>
                <span className="text-xs text-gray-600">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{p.description}</p>
              {p.url && <p className="text-xs text-amber-400 mb-2 truncate">{p.url}</p>}
              {p.proposerEmail && <p className="text-xs text-gray-500 mb-3">Contact : {p.proposerEmail}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleProposal(p.id, 'approved')} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs font-medium text-white">
                  ✓ Approuver et publier
                </button>
                <button onClick={() => handleProposal(p.id, 'rejected', 'Initiative partisane ou non conforme à la charte.')} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-300">
                  ✕ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events */}
      {view === 'events' && (
        <div className="space-y-3">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-sm font-medium text-black">
            + Créer un événement
          </button>

          {showCreateForm && (
            <form onSubmit={createEvent} className="bg-gray-900 rounded-xl border border-amber-900/30 p-4 space-y-3">
              <h4 className="font-semibold text-white">Nouvel événement</h4>
              {[
                { key: 'title', label: 'Titre *', placeholder: '', required: true },
                { key: 'description', label: 'Description *', placeholder: '', required: true },
                { key: 'organizer', label: 'Organisateur *', placeholder: '', required: true },
                { key: 'url', label: 'URL', placeholder: 'https://…', required: false },
                { key: 'location', label: 'Lieu', placeholder: '', required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input type="text" value={(newEvent as any)[key]} required={required} placeholder={placeholder}
                    onChange={(e) => setNewEvent((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" value={newEvent.eventDate} onChange={(e) => setNewEvent((p) => ({ ...p, eventDate: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Catégorie</label>
                  <select value={newEvent.category} onChange={(e) => setNewEvent((p) => ({ ...p, category: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
                    {Object.entries(CATEGORY_LABELS_ADMIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium text-white">Créer</button>
            </form>
          )}

          {events.map((ev) => (
            <div key={ev.id} className={`bg-gray-900 rounded-xl border p-4 ${ev.isActive ? 'border-gray-800' : 'border-gray-800/40 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-gray-500">{CATEGORY_LABELS_ADMIN[ev.category] ?? ev.category}</span>
                  <h4 className="font-medium text-white">{ev.title}</h4>
                  <p className="text-xs text-gray-400">{ev.organizer}</p>
                </div>
                <button onClick={() => toggleEvent(ev.id, ev.isActive)} className={`text-xs px-2 py-1 rounded focus-ring ${ev.isActive ? 'text-green-400 hover:text-red-400' : 'text-gray-600 hover:text-green-400'}`}>
                  {ev.isActive ? 'Actif' : 'Inactif'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
