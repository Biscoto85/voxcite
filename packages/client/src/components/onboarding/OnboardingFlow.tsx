import { useState, useCallback } from 'react';
import type { Question, QuestionResponse, CompassPosition, Party } from '@voxcite/shared';
import { calculatePosition } from '@/hooks/useCompassPosition';
import { QuestionCard } from './QuestionCard';
import { PostalCodeInput } from './PostalCodeInput';

type OnboardingStep = 'postal' | 'questions';

interface OnboardingFlowProps {
  questions: Question[];
  parties: Party[];
  onComplete: (position: CompassPosition, sessionId: string) => void;
}

export function OnboardingFlow({ questions, parties, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('postal');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = currentIndex / questions.length;

  const handleProfileSubmit = useCallback(async (data: { postalCode: string; infoSource: string; perceivedBias: string }) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setSessionId(result.id);
      setStep('questions');
    } catch {
      setStep('questions');
    }
  }, []);

  const handleAnswer = useCallback(async (value: -2 | -1 | 0 | 1 | 2) => {
    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id,
      value,
    };
    const newResponses = [...responses, newResponse];
    setResponses(newResponses);

    // Send to backend
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [{ questionId: currentQuestion.id, value }] }),
      }).catch(() => {});
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate final position → go directly to reveal
      const pos = calculatePosition(newResponses, questions);
      if (sessionId) onComplete(pos, sessionId);
    }
  }, [currentQuestion, responses, currentIndex, questions, sessionId, onComplete]);

  if (step === 'postal') {
    return <PostalCodeInput onSubmit={handleProfileSubmit} />;
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label={`Question ${currentIndex + 1} sur ${questions.length}`}>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentIndex + 1}
      />
    </div>
  );
}
