import { useEffect, useState } from 'react';
import type { Party } from '@voxcite/shared';
import { CompassContainer } from './components/compass';

export function App() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/partis')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setParties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">VoxCité</h1>
        <p className="text-gray-400 mt-1">On fait parler la cité.</p>
      </header>

      <main className="px-4 pb-12">
        {loading && (
          <p className="text-center text-gray-500">Chargement...</p>
        )}
        {error && (
          <p className="text-center text-red-400">
            Erreur : {error}. Le serveur tourne sur le port 3001 ?
          </p>
        )}
        {!loading && !error && parties.length > 0 && (
          <CompassContainer parties={parties} />
        )}
      </main>
    </div>
  );
}
