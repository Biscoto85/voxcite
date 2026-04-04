import { useState, useEffect, useCallback } from 'react';
import type { Question, CompassPosition } from '@voxcite/shared';
import { QuestionCard } from '../onboarding/QuestionCard';

interface DomainGroup {
  domain: string;
  label: string;
  questions: Question[];
  answered: number;
}

interface DeepQuestionsFlowProps {
  sessionId: string;
  currentPosition?: CompassPosition;
  onPositionUpdate: (position: CompassPosition) => void;
  onBack: () => void;
}

const DOMAIN_LABELS: Record<string, string> = {
  travail: 'Travail et emploi',
  sante: 'Santé et protection sociale',
  education: 'Éducation et jeunesse',
  securite: 'Sécurité et justice',
  immigration: 'Immigration et identité',
  environnement: 'Environnement et énergie',
  economie: 'Économie et fiscalité',
  numerique: 'Numérique et libertés',
  democratie: 'Démocratie et institutions',
  international: 'International et défense',
};

export function DeepQuestionsFlow({
  sessionId, currentPosition, onPositionUpdate, onBack,
}: DeepQuestionsFlowProps) {
  const [domains, setDomains] = useState<DomainGroup[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch deep questions
  useEffect(() => {
    fetch('/api/questions?phase=deep')
      .then((r) => r.json())
      .then((questions: Question[]) => {
        const grouped = new Map<string, Question[]>();
        for (const q of questions) {
          const list = grouped.get(q.domain) || [];
          list.push(q);
          grouped.set(q.domain, list);
        }

        const groups: DomainGroup[] = [];
        for (const [domain, qs] of grouped) {
          groups.push({
            domain,
            label: DOMAIN_LABELS[domain] || domain,
            questions: qs,
            answered: 0,
          });
        }
        groups.sort((a, b) => a.label.localeCompare(b.label));
        setDomains(groups);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeDomain = domains.find((d) => d.domain === selectedDomain);
  const activeQuestion = activeDomain?.questions[currentIndex];

  const handleAnswer = useCallback(async (value: -2 | -1 | 0 | 1 | 2) => {
    if (!activeQuestion || !activeDomain) return;

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

    // Mark answered
    setDomains((prev) =>
      prev.map((d) =>
        d.domain === selectedDomain ? { ...d, answered: d.answered + 1 } : d,
      ),
    );

    if (currentIndex < activeDomain.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Domain complete
      setSelectedDomain(null);
      setCurrentIndex(0);
    }
  }, [activeQuestion, activeDomain, currentIndex, selectedDomain, sessionId, onPositionUpdate]);

  if (loading) {
    return <p className="text-center text-gray-500">Chargement...</p>;
  }

  // Domain selection
  if (!selectedDomain) {
    const totalAnswered = domains.reduce((acc, d) => acc + d.answered, 0);
    const totalQuestions = domains.reduce((acc, d) => acc + d.questions.length, 0);

    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Affiner mon profil</h2>
            <p className="text-sm text-gray-400 mt-1">
              {totalAnswered} / {totalQuestions} questions répondues
            </p>
          </div>
          <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300">
            ← Menu
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Choisis un domaine pour préciser ton positionnement :
        </p>

        <div className="flex flex-col gap-2">
          {domains.map((d) => {
            const complete = d.answered >= d.questions.length;
            return (
              <button
                key={d.domain}
                onClick={() => { setSelectedDomain(d.domain); setCurrentIndex(d.answered); }}
                disabled={complete}
                className={`text-left p-3 rounded-lg border transition-all ${
                  complete
                    ? 'bg-gray-900/50 border-gray-800/50 text-gray-600'
                    : 'bg-gray-900 border-gray-800 hover:border-purple-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-xs text-gray-500">
                    {complete ? '✓' : `${d.answered}/${d.questions.length}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Question view
  if (!activeQuestion || !activeDomain) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setSelectedDomain(null); setCurrentIndex(0); }}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          ← {activeDomain.label}
        </button>
        <span className="text-xs text-gray-500">
          {currentIndex + 1} / {activeDomain.questions.length}
        </span>
      </div>

      <div className="mb-4">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / activeDomain.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={activeQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentIndex + 1}
      />
    </div>
  );
}
