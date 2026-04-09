import { useState, useCallback } from 'react';
import type { Question, QuestionResponse, CompassPosition, Party } from '@partiprism/shared';
import { calculatePosition } from '@/hooks/useCompassPosition';
import { QuestionCard } from './QuestionCard';
import { PostalCodeInput } from './PostalCodeInput';
import type { UserProfile } from '@/App';

type OnboardingStep = 'postal' | 'questions';

interface OnboardingFlowProps {
  questions: Question[];
  parties: Party[];
  onComplete: (position: CompassPosition, profile: UserProfile) => void;
}

export function OnboardingFlow({ questions, parties, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('postal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = currentIndex / questions.length;

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
      body: JSON.stringify({ questionId: currentQuestion.id, value }),
    }).catch(() => {});

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate position entirely client-side
      const pos = calculatePosition(newResponses, questions);

      // Save responses to localStorage for analysis later
      localStorage.setItem('partiprism_responses', JSON.stringify(
        newResponses.map((r) => ({ questionId: r.questionId, value: r.value })),
      ));

      if (profile) onComplete(pos, profile);
    }
  }, [currentQuestion, responses, currentIndex, questions, profile, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return;
    // Remove the last response and go back one question
    setResponses((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex]);

  if (step === 'postal') {
    return <PostalCodeInput onSubmit={handleProfileSubmit} serverError={profileError} />;
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
