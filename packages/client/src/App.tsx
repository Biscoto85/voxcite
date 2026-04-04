import { useEffect, useState, useCallback } from 'react';
import type { Party, Question, CompassPosition } from '@voxcite/shared';
import { CompassContainer } from './components/compass';
import { CompassReveal } from './components/compass/CompassReveal';
import { OnboardingFlow } from './components/onboarding';
import { MainMenu } from './components/navigation/MainMenu';
import { DeepQuestionsFlow } from './components/deep/DeepQuestionsFlow';
import { AnalysisScreen } from './components/analysis/AnalysisScreen';
import { ExprimerScreen } from './components/exprimer/ExprimerScreen';
import { CritiqueScreen } from './components/critique/CritiqueScreen';
import { FeedbackButton } from './components/feedback/FeedbackButton';

export type AppScreen = 'loading' | 'onboarding' | 'reveal' | 'menu' | 'prisme' | 'affiner' | 'comparaison' | 'critique' | 'exprimer';

const SESSION_KEY = 'voxcite_session_id';

const SCREEN_TITLES: Record<AppScreen, string> = {
  loading: 'Chargement',
  onboarding: 'Bienvenue',
  reveal: 'Ton positionnement',
  menu: 'Menu principal',
  prisme: 'Prisme',
  affiner: 'Affiner',
  comparaison: 'Comparaison',
  critique: 'Esprit critique',
  exprimer: 'M\'exprimer',
};

export function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [parties, setParties] = useState<Party[]>([]);
  const [onboardingQuestions, setOnboardingQuestions] = useState<Question[]>([]);
  const [userPosition, setUserPosition] = useState<CompassPosition | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data + try to restore session
  useEffect(() => {
    const savedSessionId = localStorage.getItem(SESSION_KEY);

    Promise.all([
      fetch('/api/partis').then((r) => r.json()),
      fetch('/api/questions/onboarding').then((r) => r.json()),
      savedSessionId
        ? fetch(`/api/sessions/${savedSessionId}`).then((r) => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([p, q, existingSession]) => {
        setParties(p);
        setOnboardingQuestions(q);

        if (existingSession && existingSession.position) {
          // Restore session
          setSessionId(existingSession.id);
          setUserPosition(existingSession.position);
          setScreen('menu');
        } else {
          // Clear stale session
          if (savedSessionId) localStorage.removeItem(SESSION_KEY);
          setScreen('onboarding');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleOnboardingComplete = useCallback((position: CompassPosition, sid: string) => {
    setUserPosition(position);
    setSessionId(sid);
    localStorage.setItem(SESSION_KEY, sid);
    setScreen('reveal');
  }, []);

  const handlePositionUpdate = useCallback((position: CompassPosition) => {
    setUserPosition(position);
  }, []);

  // Show feedback button on all screens except loading/onboarding
  const showFeedback = screen !== 'loading' && screen !== 'onboarding';
  const canGoHome = screen !== 'loading' && screen !== 'onboarding' && screen !== 'reveal';

  return (
    <div className="min-h-screen bg-gray-950 text-white safe-bottom">
      {/* Skip to content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-purple-600 focus:px-4 focus:py-2 focus:rounded-lg focus:text-white"
      >
        Aller au contenu principal
      </a>

      <header className="py-4 px-4 text-center sm:py-6" role="banner">
        <h1 className="text-2xl font-bold sm:text-3xl">
          <button
            onClick={() => canGoHome && setScreen('menu')}
            className="hover:text-purple-400 transition-colors focus-ring rounded-lg px-2"
            aria-label="Retour au menu principal VoxCité"
          >
            VoxCité
          </button>
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">On fait parler la cité.</p>
      </header>

      <main
        id="main-content"
        className="px-4 pb-16 sm:pb-12"
        role="main"
        aria-label={SCREEN_TITLES[screen]}
      >
        {screen === 'loading' && !error && (
          <div role="status" aria-live="polite">
            <p className="text-center text-gray-500">Chargement...</p>
          </div>
        )}
        {error && (
          <div role="alert">
            <p className="text-center text-red-400">
              Erreur : {error}. Le serveur tourne sur le port 3001 ?
            </p>
          </div>
        )}

        {screen === 'onboarding' && onboardingQuestions.length > 0 && (
          <OnboardingFlow
            questions={onboardingQuestions}
            parties={parties}
            onComplete={handleOnboardingComplete}
          />
        )}

        {screen === 'reveal' && userPosition && (
          <CompassReveal
            parties={parties}
            userPosition={userPosition}
            onContinue={() => setScreen('menu')}
          />
        )}

        {screen === 'menu' && (
          <MainMenu
            userPosition={userPosition}
            onNavigate={setScreen}
          />
        )}

        {screen === 'prisme' && parties.length > 0 && (
          <CompassContainer parties={parties} userPosition={userPosition} onBack={() => setScreen('menu')} />
        )}

        {screen === 'affiner' && sessionId && (
          <DeepQuestionsFlow
            sessionId={sessionId}
            currentPosition={userPosition}
            onPositionUpdate={handlePositionUpdate}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'comparaison' && userPosition && (
          <AnalysisScreen
            position={userPosition}
            parties={parties}
            sessionId={sessionId}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'critique' && sessionId && userPosition && (
          <CritiqueScreen
            sessionId={sessionId}
            userPosition={userPosition}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'exprimer' && sessionId && userPosition && (
          <ExprimerScreen
            sessionId={sessionId}
            userPosition={userPosition}
            onBack={() => setScreen('menu')}
          />
        )}
      </main>

      {/* Global feedback button */}
      {showFeedback && (
        <FeedbackButton sessionId={sessionId} screen={screen} />
      )}
    </div>
  );
}
