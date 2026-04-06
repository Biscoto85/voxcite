import { useState, useEffect, useCallback } from 'react';

type Tab = 'dashboard' | 'prompts' | 'questions' | 'feedbacks' | 'proposals' | 'api-calls';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'questions', label: 'Questions' },
  { id: 'feedbacks', label: 'Feedbacks' },
  { id: 'proposals', label: 'Propositions' },
  { id: 'api-calls', label: 'API Calls' },
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
        {tab === 'prompts' && <PromptsTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'feedbacks' && <FeedbacksTab />}
        {tab === 'proposals' && <ProposalsTab />}
        {tab === 'api-calls' && <ApiCallsTab />}
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

// ── Prompts ──────────────────────────────────────────────────────────

function PromptsTab() {
  const [allPrompts, setAllPrompts] = useState<any[]>([]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testModel, setTestModel] = useState('claude-sonnet-4-20250514');

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
          {['analysis', 'program', 'link_validation'].map((key) => (
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
              {key === 'analysis' ? '+ Analyse' : key === 'program' ? '+ Programme' : '+ Validation'}
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
              <option value="claude-sonnet-4-20250514">Sonnet (~2¢)</option>
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

  useEffect(() => {
    adminFetch('/questions').then((r) => r.json()).then(setAllQuestions).catch(() => {});
  }, []);

  const filtered = filter
    ? allQuestions.filter((q) => q.phase === filter || q.axis === filter || q.domainId === filter)
    : allQuestions;

  const handleSave = async (id: string) => {
    await adminFetch(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text: editText }),
    });
    setAllQuestions((prev) => prev.map((q) => q.id === id ? { ...q, text: editText } : q));
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
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(q.id)} className="px-3 py-1 bg-amber-500 rounded text-xs text-black font-medium">Sauver</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-700 rounded text-xs">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200 cursor-pointer" onClick={() => { setEditingId(q.id); setEditText(q.text); }}>
                    {q.text}
                  </p>
                )}
                <div className="flex gap-2 mt-1 text-[10px] text-gray-600">
                  <span>{q.phase}</span>
                  <span>axe: {q.axis}</span>
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

      {items.map((f) => (
        <div key={f.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-gray-200">{f.description}</p>
              <div className="flex gap-2 mt-1 text-[10px] text-gray-600">
                <span className="text-amber-400">{f.feedbackType}</span>
                <span>{f.targetType}</span>
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
