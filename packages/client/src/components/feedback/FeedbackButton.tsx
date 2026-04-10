import { useState, useEffect, useRef } from 'react';
import type { AppScreen, FeedbackContext } from '@/App';

interface FeedbackButtonProps {
  screen: AppScreen;
  context?: FeedbackContext;
}

const FEEDBACK_TYPES = [
  { value: 'bias', label: 'Formulation biaisée' },
  { value: 'formulation', label: 'Formulation confuse ou implicite' },
  { value: 'missing_topic', label: 'Thématique manquante' },
  { value: 'other', label: 'Autre remarque' },
] as const;

export function FeedbackButton({ screen, context }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>('bias');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const hasQuestionContext = Boolean(context?.questionId);

  // Trap focus when modal opens
  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: hasQuestionContext ? 'question' : 'general',
          targetId: context?.questionId ?? null,
          feedbackType,
          description: description.trim(),
          screen,
        }),
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setDescription('');
      }, 1500);
    } catch {
      // Silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg z-40 touch-target focus-ring"
        aria-label={hasQuestionContext ? 'Signaler un problème avec cette question' : 'Signaler un biais ou faire une suggestion'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
          <path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zm10.857 5.691a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Signaler ou suggérer"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5">
            {sent ? (
              <div className="text-center py-6" role="status" aria-live="polite">
                <p className="text-green-400 font-medium">Merci pour ton retour !</p>
                <p className="text-gray-500 text-sm mt-1">Il sera pris en compte pour améliorer PartiPrism.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg" id="feedback-title">Signaler / Suggérer</h3>
                  <button
                    ref={closeRef}
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-white touch-target flex items-center justify-center focus-ring rounded-lg"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>

                {/* Question context badge */}
                {hasQuestionContext && context?.questionText && (
                  <div className="bg-indigo-950/40 border border-indigo-700/30 rounded-lg px-3 py-2 mb-4">
                    <p className="text-xs text-indigo-400 mb-0.5">Question concernée</p>
                    <p className="text-xs text-indigo-200 leading-snug line-clamp-2">{context.questionText}</p>
                  </div>
                )}

                <p className="text-sm text-gray-400 mb-4">
                  {hasQuestionContext
                    ? 'Tu signales un problème sur cette question spécifique.'
                    : 'PartiPrism est un projet en amélioration continue. Aide-nous à détecter les biais, les formulations maladroites ou les thématiques oubliées.'}
                </p>

                <fieldset>
                  <legend className="sr-only">Type de retour</legend>
                  <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Type de retour">
                    {FEEDBACK_TYPES.map((ft) => (
                      <button
                        key={ft.value}
                        onClick={() => setFeedbackType(ft.value)}
                        role="radio"
                        aria-checked={feedbackType === ft.value}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors touch-target focus-ring ${
                          feedbackType === ft.value
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label htmlFor="feedback-description" className="sr-only">
                  Description
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris ce que tu as remarqué..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 resize-none"
                  rows={3}
                  aria-required="true"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || sending}
                  className="mt-3 w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors touch-target focus-ring"
                >
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
