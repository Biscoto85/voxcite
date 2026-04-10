import { useState, useCallback, useRef, useEffect } from 'react';
import type { Question, QuestionResponse, CompassPosition, Party } from '@partiprism/shared';
import { calculatePosition } from '@/hooks/useCompassPosition';
import { QuestionCard } from './QuestionCard';
import { PostalCodeInput } from './PostalCodeInput';
import type { UserProfile } from '@/App';

type OnboardingStep = 'postal' | 'questions';

interface OnboardingFlowProps {
  questions: Question[];
  parties: Party[];
  challengerPosition?: CompassPosition | null;
  onComplete: (position: CompassPosition, profile: UserProfile, qualityScore: number) => void;
  onQuestionChange?: (questionId: string, questionText: string) => void;
}

/** Compute a 0–1 quality score from timing and response patterns. */
function computeQualityScore(timings: number[], responses: QuestionResponse[]): number {
  if (timings.length === 0) return 1.0;

  const avgMs = timings.reduce((s, t) => s + t, 0) / timings.length;

  // Speed factor: < 400ms avg = robot-like; < 1500ms = very fast; < 3000ms = fast
  const speedFactor = avgMs < 400 ? 0.05 : avgMs < 1500 ? 0.4 : avgMs < 3000 ? 0.75 : 1.0;

  // Uniformity factor: heavily penalize all-same-value patterns
  const valueCounts = new Map<number, number>();
  for (const r of responses) valueCounts.set(r.value, (valueCounts.get(r.value) ?? 0) + 1);
  const maxCount = Math.max(...valueCounts.values());
  const uniformRatio = maxCount / responses.length;
  const uniformityFactor = uniformRatio > 0.8 ? 0.25 : uniformRatio > 0.6 ? 0.6 : 1.0;

  // Extreme factor: penalize if > 85% of answers are ±2
  const extremeCount = responses.filter((r) => Math.abs(r.value) === 2).length;
  const extremeRatio = extremeCount / responses.length;
  const extremeFactor = extremeRatio > 0.85 ? 0.7 : 1.0;

  return Math.round(Math.min(1, speedFactor * uniformityFactor * extremeFactor) * 100) / 100;
}

export function OnboardingFlow({ questions, parties, challengerPosition, onComplete, onQuestionChange }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('postal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const timingsRef = useRef<number[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = currentIndex / questions.length;

  // Notify parent when question changes (for feedback contextualization)
  useEffect(() => {
    if (currentQuestion && step === 'questions' && onQuestionChange) {
      onQuestionChange(currentQuestion.id, currentQuestion.text);
    }
  }, [currentQuestion, step, onQuestionChange]);

  // Validate postal code via server (checks IP distance) then move to questions
  const handleProfileSubmit = useCallback(async (data: UserProfile) => {
    setProfileError(null);

    try {
      const res = await fetch('/api/sessions/validate-postal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: data.postalCode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }));
        if (res.status === 403) {
          setProfileError(err.error || 'Code postal incohérent avec ta localisation.');
          return;
        }
        if (res.status === 429) {
          setProfileError('Trop de tentatives. Réessaie dans quelques minutes.');
          return;
        }
      }
    } catch {
      // Network error — accept and continue
    }

    setProfile(data);
    setStep('questions');
  }, []);

  const handleAnswer = useCallback(async (value: -2 | -1 | 0 | 1 | 2) => {
    const durationMs = Date.now() - questionStartRef.current;
    timingsRef.current = [...timingsRef.current, durationMs];
    questionStartRef.current = Date.now();

    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id,
      value,
    };
    const newResponses = [...responses, newResponse];
    setResponses(newResponses);

    // Send anonymous vote (fire-and-forget, no session)
    fetch('/api/sessions/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: currentQuestion.id, value, durationMs }),
    }).catch(() => {});

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate position entirely client-side
      const pos = calculatePosition(newResponses, questions);
      const qualityScore = computeQualityScore(timingsRef.current, newResponses);

      // Save responses to localStorage for analysis later
      localStorage.setItem('partiprism_responses', JSON.stringify(
        newResponses.map((r) => ({ questionId: r.questionId, value: r.value })),
      ));

      if (profile) onComplete(pos, profile, qualityScore);
    }
  }, [currentQuestion, responses, currentIndex, questions, profile, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return;
    // Remove the last response and go back one question
    setResponses((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex]);

  if (step === 'postal') {
    return (
      <>
        {challengerPosition && (
          <div className="max-w-lg mx-auto mb-4">
            <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl shrink-0" aria-hidden="true">⚡</span>
              <p className="text-sm text-indigo-200">
                Quelqu'un t'a lancé un défi — réponds aux questions pour comparer vos positionnements.
              </p>
            </div>
          </div>
        )}
        <PostalCodeInput onSubmit={handleProfileSubmit} serverError={profileError} />
      </>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label={`Question ${currentIndex + 1} sur ${questions.length}`}>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        onBack={handleBack}
        canGoBack={currentIndex > 0}
        questionNumber={currentIndex + 1}
      />
    </div>
  );
}
