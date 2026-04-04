import type { Question } from '@voxcite/shared';
import { RESPONSE_LABELS_AFFIRMATION } from '@voxcite/shared';

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: -2 | -1 | 0 | 1 | 2) => void;
  questionNumber: number;
}

export function QuestionCard({ question, onAnswer, questionNumber }: QuestionCardProps) {
  const isDialemme = question.type === 'dilemme' && question.options;

  const options = isDialemme
    ? question.options!.map((label, i) => ({
        value: (i - 2) as -2 | -1 | 0 | 1 | 2,
        label,
      }))
    : RESPONSE_LABELS_AFFIRMATION.map((o) => ({
        value: o.value as -2 | -1 | 0 | 1 | 2,
        label: o.label,
      }));

  // Colors for the 5 buttons (red → gray → green)
  const buttonColors = [
    'hover:bg-red-900/40 hover:border-red-500',
    'hover:bg-orange-900/30 hover:border-orange-500',
    'hover:bg-gray-700/40 hover:border-gray-500',
    'hover:bg-emerald-900/30 hover:border-emerald-500',
    'hover:bg-green-900/40 hover:border-green-500',
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <p className="text-lg leading-relaxed mb-8">
        {question.text}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.value)}
            className={`w-full py-3 px-4 rounded-lg border border-gray-700 text-sm text-left transition-all ${buttonColors[i]} active:scale-[0.98]`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
