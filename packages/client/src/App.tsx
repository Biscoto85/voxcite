import { useEffect, useState, useCallback } from 'react';
import type { Party, Question, CompassPosition } from '@voxcite/shared';
import { CompassContainer } from './components/compass';
import { OnboardingFlow } from './components/onboarding';

type AppScreen = 'loading' | 'onboarding' | 'compass';

export function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [parties, setParties] = useState<Party[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userPosition, setUserPosition] = useState<CompassPosition | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/api/partis').then((r) => r.json()),
      fetch('/api/questions/onboarding').then((r) => r.json()),
    ])
      .then(([p, q]) => {
        setParties(p);
        setQuestions(q);
        setScreen('onboarding');
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleOnboardingComplete = useCallback((position: CompassPosition) => {
    setUserPosition(position);
    setScreen('compass');
  }, []);

  // Listen for "see compass" from ResultScreen
  useEffect(() => {
    const handler = () => setScreen('compass');
    window.addEventListener('onboarding-complete', handler);
    return () => window.removeEventListener('onboarding-complete', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">
          <button onClick={() => setScreen(userPosition ? 'compass' : 'onboarding')} className="hover:text-purple-400 transition-colors">
            VoxCité
          </button>
        </h1>
        <p className="text-gray-400 mt-1">On fait parler la cité.</p>
        {screen === 'compass' && (
          <button
            onClick={() => { setUserPosition(undefined); setScreen('onboarding'); }}
            className="mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Recommencer le questionnaire
          </button>
        )}
      </header>

      <main className="px-4 pb-12">
        {screen === 'loading' && !error && (
          <p className="text-center text-gray-500">Chargement...</p>
        )}
        {error && (
          <p className="text-center text-red-400">
            Erreur : {error}. Le serveur tourne sur le port 3001 ?
          </p>
        )}
        {screen === 'onboarding' && questions.length > 0 && (
          <OnboardingFlow
            questions={questions}
            parties={parties}
            onComplete={handleOnboardingComplete}
          />
        )}
        {screen === 'compass' && parties.length > 0 && (
          <CompassContainer parties={parties} userPosition={userPosition} />
        )}
      </main>
    </div>
  );
}
