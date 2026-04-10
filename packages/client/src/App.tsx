import { useEffect, useState, useCallback } from 'react';
import type { Party, Question, CompassPosition } from '@partiprism/shared';
import { CompassContainer } from './components/compass';
import { CompassReveal } from './components/compass/CompassReveal';
import { OnboardingFlow } from './components/onboarding';
import { MainMenu } from './components/navigation/MainMenu';
import { DeepQuestionsFlow } from './components/deep/DeepQuestionsFlow';
import { AnalysisScreen } from './components/analysis/AnalysisScreen';
import { ExprimerScreen } from './components/exprimer/ExprimerScreen';
import { CritiqueScreen } from './components/critique/CritiqueScreen';
import { FeedbackButton } from './components/feedback/FeedbackButton';
import { MentionsLegales } from './components/legal/MentionsLegales';
import { CGU } from './components/legal/CGU';
import { NotreIntention } from './components/legal/NotreIntention';
import { Methodologie } from './components/legal/Methodologie';
import { QGPanel } from './components/qg/QGPanel';
import { parseChallengeFromHash } from './utils/challenge';
import { ShareButton } from './components/share/ShareButton';

export type AppScreen = 'loading' | 'onboarding' | 'reveal' | 'menu' | 'prisme' | 'affiner' | 'comparaison' | 'critique' | 'exprimer' | 'mentions' | 'cgu' | 'intention' | 'methodologie' | 'qg';

// ── localStorage keys ──────────────────────────────────────────────
const LS = {
  POSITION: 'partiprism_position',
  PROFILE: 'partiprism_profile',
  RESPONSES: 'partiprism_responses',
  ONBOARDING_DONE: 'partiprism_onboarding_done',
  ANALYSIS: 'partiprism_analysis',
} as const;

export interface UserProfile {
  postalCode: string;
  infoFormats: string[];       // formats multi-select (v2)
  mediaSources: string[];      // IDs de médias spécifiques, peut être vide (v2)
  infoDiversity: string;       // 'regularly' | 'sometimes' | 'rarely' | 'never' (v2)
  perceivedBias: string;       // 'gauche' | 'droite' | 'varie' | 'difficile'
  mediaRelationship: string;   // 'trust' | 'critical' | 'independent' | 'avoid' (v2)
  infoSource?: string;         // legacy — peut exister dans le localStorage existant
}

export interface FeedbackContext {
  questionId?: string;
  questionText?: string;
}

function loadFromLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

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
  mentions: 'Mentions légales',
  cgu: 'Conditions Générales d\'Utilisation',
  intention: 'Notre intention',
  methodologie: 'Méthodologie',
  qg: 'Quartier Général',
};

export function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('menu');
  const [parties, setParties] = useState<Party[]>([]);
  const [onboardingQuestions, setOnboardingQuestions] = useState<Question[]>([]);
  const [domainLabels, setDomainLabels] = useState<Record<string, string>>({});
  const [userPosition, setUserPosition] = useState<CompassPosition | undefined>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext>({});

  // Parse challenge URL (#defi/...) or QG access (#qg) synchronously on first render
  const [challengerPosition] = useState<CompassPosition | null>(() => {
    const hash = window.location.hash;
    if (hash === '#qg') {
      // Clean hash and flag for QG screen (handled in useEffect after load)
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return null;
    }
    const pos = parseChallengeFromHash();
    if (pos) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return pos;
  });

  // Detect #qg hash for admin access
  const [isQGAccess] = useState(() => window.location.hash === '#qg' || false);

  // Navigate to static pages (legal + intention + methodologie)
  const navigateToLegal = useCallback((target: 'mentions' | 'cgu' | 'intention' | 'methodologie') => {
    if (screen !== 'mentions' && screen !== 'cgu' && screen !== 'intention' && screen !== 'methodologie') setPreviousScreen(screen);
    setScreen(target);
    window.scrollTo(0, 0);
  }, [screen]);

  const navigateBackFromLegal = useCallback(() => {
    setScreen(previousScreen);
  }, [previousScreen]);

  // Load data + restore local state
  useEffect(() => {
    // Check hash again at load time (after React hydration)
    if (window.location.hash === '#qg') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setScreen('qg');
      return;
    }

    Promise.all([
      fetch('/api/partis').then((r) => r.json()),
      fetch('/api/questions/onboarding').then((r) => r.json()),
      fetch('/api/domains').then((r) => r.json()),
    ])
      .then(([p, q, d]) => {
        setParties(p);
        setOnboardingQuestions(q);
        // Build domain label map from API (instead of hardcoding)
        const labels: Record<string, string> = {};
        for (const domain of d) labels[domain.id] = domain.label;
        setDomainLabels(labels);

        // Restore from localStorage
        const savedPosition = loadFromLS<CompassPosition>(LS.POSITION);
        const savedProfile = loadFromLS<UserProfile>(LS.PROFILE);
        const onboardingDone = localStorage.getItem(LS.ONBOARDING_DONE) === 'true';

        if (onboardingDone && savedPosition) {
          setUserPosition(savedPosition);
          setUserProfile(savedProfile);
          // If arriving via a challenge link, go to reveal to show comparison
          setScreen(challengerPosition ? 'reveal' : 'menu');
        } else {
          setScreen('onboarding');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleOnboardingComplete = useCallback((position: CompassPosition, profile: UserProfile, qualityScore: number) => {
    setUserPosition(position);
    setUserProfile(profile);
    setFeedbackContext({});
    localStorage.setItem(LS.POSITION, JSON.stringify(position));
    localStorage.setItem(LS.PROFILE, JSON.stringify(profile));
    localStorage.setItem(LS.ONBOARDING_DONE, 'true');

    // Send anonymous snapshot for nebula (fire-and-forget)
    fetch('/api/sessions/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postalCode: profile.postalCode,
        position,
        perceivedBias: profile.perceivedBias,
        infoFormats: profile.infoFormats,
        mediaSources: profile.mediaSources,
        infoDiversity: profile.infoDiversity,
        mediaRelationship: profile.mediaRelationship,
        qualityScore,
      }),
    }).catch(() => {});

    setScreen('reveal');
  }, []);

  const handlePositionUpdate = useCallback((position: CompassPosition) => {
    setUserPosition(position);
    localStorage.setItem(LS.POSITION, JSON.stringify(position));
  }, []);

  const handleQuestionChange = useCallback((questionId: string, questionText: string) => {
    setFeedbackContext({ questionId, questionText });
  }, []);

  const isStaticPage = screen === 'mentions' || screen === 'cgu' || screen === 'intention' || screen === 'methodologie';
  const showFeedback = screen !== 'loading' && screen !== 'onboarding' && screen !== 'qg' && !isStaticPage;
  const canGoHome = screen !== 'loading' && screen !== 'onboarding' && screen !== 'reveal' && screen !== 'qg' && !isStaticPage;
  const showFooter = screen !== 'loading' && screen !== 'qg';

  return (
    <div className="min-h-screen bg-gray-950 text-white safe-bottom flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-amber-500 focus:px-4 focus:py-2 focus:rounded-lg focus:text-white"
      >
        Aller au contenu principal
      </a>

      {screen !== 'qg' && (
        <header className="relative py-4 px-4 text-center sm:py-6" role="banner">
          <button
            onClick={() => canGoHome && setScreen('menu')}
            className="inline-flex flex-col items-center gap-1 hover:opacity-80 transition-opacity focus-ring rounded-lg px-4 py-1"
            aria-label="Retour au menu principal PartiPrism"
          >
            <img src="/logo.svg" alt="" className="h-10 sm:h-12 w-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold sm:text-3xl text-amber-400 tracking-wide">PartiPrism</h1>
          </button>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm tracking-widest uppercase">Voir plus clair, penser plus large</p>
          {/* Share button — top-right, visible once the user has a result */}
          {userPosition && screen !== 'onboarding' && screen !== 'loading' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ShareButton userPosition={userPosition} parties={parties} />
            </div>
          )}
        </header>
      )}

      <main id="main-content" className="px-4 pb-8 flex-1" role="main" aria-label={SCREEN_TITLES[screen]}>
        {screen === 'loading' && !error && (
          <div role="status" aria-live="polite">
            <p className="text-center text-gray-500">Chargement...</p>
          </div>
        )}
        {error && (
          <div role="alert">
            <p className="text-center text-red-400">Erreur : {error}. Le serveur tourne sur le port 3001 ?</p>
          </div>
        )}

        {screen === 'onboarding' && onboardingQuestions.length > 0 && (
          <OnboardingFlow
            questions={onboardingQuestions}
            parties={parties}
            challengerPosition={challengerPosition}
            onComplete={handleOnboardingComplete}
            onQuestionChange={handleQuestionChange}
          />
        )}

        {screen === 'reveal' && userPosition && (
          <CompassReveal
            parties={parties}
            userPosition={userPosition}
            challengerPosition={challengerPosition}
            onContinue={() => setScreen('menu')}
          />
        )}

        {screen === 'menu' && (
          <MainMenu userPosition={userPosition} parties={parties} onNavigate={setScreen} />
        )}

        {screen === 'prisme' && parties.length > 0 && (
          <CompassContainer parties={parties} userPosition={userPosition} onBack={() => setScreen('menu')} />
        )}

        {screen === 'affiner' && userPosition && (
          <DeepQuestionsFlow
            currentPosition={userPosition}
            onPositionUpdate={handlePositionUpdate}
            onBack={() => { setFeedbackContext({}); setScreen('menu'); }}
            onQuestionChange={handleQuestionChange}
          />
        )}

        {screen === 'comparaison' && userPosition && (
          <AnalysisScreen
            position={userPosition}
            parties={parties}
            profile={userProfile}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'critique' && userPosition && (
          <CritiqueScreen
            userPosition={userPosition}
            domainLabels={domainLabels}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'exprimer' && userPosition && (
          <ExprimerScreen
            userPosition={userPosition}
            domainLabels={domainLabels}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'mentions' && (
          <MentionsLegales onBack={navigateBackFromLegal} onNavigateCGU={() => navigateToLegal('cgu')} />
        )}

        {screen === 'cgu' && (
          <CGU onBack={navigateBackFromLegal} onNavigateMentions={() => navigateToLegal('mentions')} />
        )}

        {screen === 'intention' && (
          <NotreIntention onBack={navigateBackFromLegal} />
        )}

        {screen === 'methodologie' && (
          <Methodologie onBack={navigateBackFromLegal} />
        )}

        {screen === 'qg' && (
          <QGPanel />
        )}
      </main>

      {showFooter && (
        <footer className="py-4 px-4 border-t border-gray-900 text-center" role="contentinfo">
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            <button onClick={() => navigateToLegal('intention')} className={`hover:text-gray-400 transition-colors focus-ring rounded px-1 ${screen === 'intention' ? 'text-amber-400' : ''}`}>
              Notre intention
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => navigateToLegal('methodologie')} className={`hover:text-gray-400 transition-colors focus-ring rounded px-1 ${screen === 'methodologie' ? 'text-amber-400' : ''}`}>
              Méthodologie
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => navigateToLegal('mentions')} className={`hover:text-gray-400 transition-colors focus-ring rounded px-1 ${screen === 'mentions' ? 'text-amber-400' : ''}`}>
              Mentions légales
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => navigateToLegal('cgu')} className={`hover:text-gray-400 transition-colors focus-ring rounded px-1 ${screen === 'cgu' ? 'text-amber-400' : ''}`}>
              CGU
            </button>
            <span aria-hidden="true">·</span>
            <a href="mailto:contact@partiprism.fr" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </footer>
      )}

      {showFeedback && (
        <FeedbackButton screen={screen} context={feedbackContext} />
      )}
    </div>
  );
}
