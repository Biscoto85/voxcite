import { useEffect, useState, useCallback } from 'react';
import type { Party, Question, CompassPosition } from '@voxcite/shared';
import { CompassContainer } from './components/compass';
import { OnboardingFlow } from './components/onboarding';
import { MainMenu } from './components/navigation/MainMenu';
import { DeepQuestionsFlow } from './components/deep/DeepQuestionsFlow';
import { AnalysisScreen } from './components/analysis/AnalysisScreen';

export type AppScreen = 'loading' | 'onboarding' | 'menu' | 'prisme' | 'affiner' | 'analyse' | 'critique' | 'programme';

export function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [parties, setParties] = useState<Party[]>([]);
  const [onboardingQuestions, setOnboardingQuestions] = useState<Question[]>([]);
  const [userPosition, setUserPosition] = useState<CompassPosition | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/api/partis').then((r) => r.json()),
      fetch('/api/questions/onboarding').then((r) => r.json()),
    ])
      .then(([p, q]) => {
        setParties(p);
        setOnboardingQuestions(q);
        setScreen('onboarding');
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleOnboardingComplete = useCallback((position: CompassPosition, sid: string) => {
    setUserPosition(position);
    setSessionId(sid);
  }, []);

  // Listen for "see compass" from ResultScreen
  useEffect(() => {
    const handler = () => setScreen('menu');
    window.addEventListener('onboarding-complete', handler);
    return () => window.removeEventListener('onboarding-complete', handler);
  }, []);

  const handlePositionUpdate = useCallback((position: CompassPosition) => {
    setUserPosition(position);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">
          <button
            onClick={() => screen !== 'loading' && screen !== 'onboarding' && setScreen('menu')}
            className="hover:text-purple-400 transition-colors"
          >
            VoxCité
          </button>
        </h1>
        <p className="text-gray-400 mt-1">On fait parler la cité.</p>
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

        {screen === 'onboarding' && onboardingQuestions.length > 0 && (
          <OnboardingFlow
            questions={onboardingQuestions}
            parties={parties}
            onComplete={handleOnboardingComplete}
          />
        )}

        {screen === 'menu' && (
          <MainMenu
            userPosition={userPosition}
            onNavigate={setScreen}
          />
        )}

        {screen === 'prisme' && parties.length > 0 && (
          <CompassContainer parties={parties} userPosition={userPosition} />
        )}

        {screen === 'affiner' && sessionId && (
          <DeepQuestionsFlow
            sessionId={sessionId}
            currentPosition={userPosition}
            onPositionUpdate={handlePositionUpdate}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'analyse' && userPosition && (
          <AnalysisScreen
            position={userPosition}
            parties={parties}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'critique' && (
          <div className="max-w-lg mx-auto text-center py-12">
            <h2 className="text-xl font-bold mb-2">Esprit critique</h2>
            <p className="text-gray-400">Bientôt disponible.</p>
            <button onClick={() => setScreen('menu')} className="mt-4 text-purple-400 hover:text-purple-300">← Retour</button>
          </div>
        )}

        {screen === 'programme' && (
          <div className="max-w-lg mx-auto text-center py-12">
            <h2 className="text-xl font-bold mb-2">Mon programme citoyen</h2>
            <p className="text-gray-400">Bientôt disponible.</p>
            <button onClick={() => setScreen('menu')} className="mt-4 text-purple-400 hover:text-purple-300">← Retour</button>
          </div>
        )}
      </main>
    </div>
  );
}
