import { useState, useEffect, useCallback } from 'react';
import type { Question, CompassPosition } from '@partiprism/shared';
import { QuestionCard } from '../onboarding/QuestionCard';

interface DeepQuestionsFlowProps {
  sessionId: string;
  currentPosition?: CompassPosition;
  onPositionUpdate: (position: CompassPosition) => void;
  onBack: () => void;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DeepQuestionsFlow({
  sessionId, currentPosition, onPositionUpdate, onBack,
}: DeepQuestionsFlowProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  // Shuffle once on mount
  useEffect(() => {
    fetch('/api/questions?phase=deep')
      .then((r) => r.json())
      .then((qs: Question[]) => {
        setQuestions(shuffle(qs));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeQuestion = questions[currentIndex];

  const handleAnswer = useCallback(async (value: -2 | -1 | 0 | 1 | 2) => {
    if (!activeQuestion) return;

    // Send answer
    try {
      const res = await fetch(`/api/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [{ questionId: activeQuestion.id, value }] }),
      });
      const data = await res.json();
      if (data.position) onPositionUpdate(data.position);
    } catch {}

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setDone(true);
    }
  }, [activeQuestion, currentIndex, questions.length, sessionId, onPositionUpdate]);

  if (loading) {
    return <p className="text-center text-gray-500" role="status">Chargement...</p>;
  }

  if (done || questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-2">
          {questions.length === 0 ? 'Aucune question disponible' : 'Bravo, tu as répondu à toutes les questions !'}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Ton profil est maintenant beaucoup plus précis.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors touch-target focus-ring"
        >
          Retour au menu
        </button>
      </div>
    );
  }

  if (!activeQuestion) return null;

  const progress = currentIndex / questions.length;

  return (
    <section className="max-w-lg mx-auto" aria-label="Questions approfondies">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-purple-400 hover:text-purple-300 focus-ring rounded py-1 px-2"
        >
          ← Menu
        </button>
        <span className="text-xs text-gray-500">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-4" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label={`Question ${currentIndex + 1} sur ${questions.length}`}>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={activeQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentIndex + 1}
      />
    </section>
  );
}
