import { useState } from 'react';
import type { AppScreen } from '@/App';

interface FeedbackButtonProps {
  sessionId: string | null;
  screen: AppScreen;
}

const FEEDBACK_TYPES = [
  { value: 'bias', label: 'Formulation biaisée' },
  { value: 'formulation', label: 'Formulation confuse ou implicite' },
  { value: 'missing_topic', label: 'Thématique manquante' },
  { value: 'other', label: 'Autre remarque' },
] as const;

export function FeedbackButton({ sessionId, screen }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>('bias');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          targetType: 'general',
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
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg z-40"
        title="Signaler un biais ou faire une suggestion"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zm10.857 5.691a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5">
            {sent ? (
              <div className="text-center py-6">
                <p className="text-green-400 font-medium">Merci pour ton retour !</p>
                <p className="text-gray-500 text-sm mt-1">Il sera pris en compte pour améliorer VoxCité.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Signaler / Suggérer</h3>
                  <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                    ✕
                  </button>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  VoxCité est un projet en amélioration continue. Aide-nous à détecter
                  les biais, les formulations maladroites ou les thématiques oubliées.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      onClick={() => setFeedbackType(ft.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        feedbackType === ft.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris ce que tu as remarqué..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />

                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || sending}
                  className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium text-sm transition-colors"
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
