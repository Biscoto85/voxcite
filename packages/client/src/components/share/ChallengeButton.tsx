import { useState, useCallback, useEffect, useRef } from 'react';
import type { CompassPosition } from '@partiprism/shared';
import { buildChallengeUrl } from '@/utils/challenge';
import { whatsappUrl, telegramUrl, smsUrl, twitterUrl } from '@/utils/share';

interface ChallengeButtonProps {
  userPosition: CompassPosition;
}

const CHALLENGE_TEXT = 'Je viens de tester mon positionnement politique en 5 axes sur PartiPrism — relève le défi et compare nos résultats !';
const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function ChallengeButton({ userPosition }: ChallengeButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const url = buildChallengeUrl(userPosition);
  const fullText = `${CHALLENGE_TEXT} ${url}`;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleWebShare = useCallback(() => {
    navigator.share({ title: 'Défi PartiPrism', text: CHALLENGE_TEXT, url })
      .then(() => { setShared(true); setTimeout(() => setShared(false), 3000); })
      .catch(() => {});
  }, [url]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }, [fullText]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Défier quelqu'un sur PartiPrism"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-ring ${
          open
            ? 'bg-indigo-600 text-white'
            : 'bg-indigo-900/60 hover:bg-indigo-800/70 text-indigo-200 border border-indigo-700/50'
        }`}
      >
        <span aria-hidden="true">⚡</span>
        <span className="hidden sm:inline">Défi</span>
      </button>

      {open && (
        <>
          {/* Backdrop on mobile */}
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Défier quelqu'un sur PartiPrism"
            className="absolute right-0 top-full mt-2 z-50 w-[min(92vw,360px)] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">⚡ Défier quelqu'un</p>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none focus-ring rounded p-1"
                aria-label="Fermer"
              >×</button>
            </div>

            {/* Message preview */}
            <div className="bg-gray-800 rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Message envoyé</p>
              <p className="text-xs text-gray-300 leading-relaxed">{CHALLENGE_TEXT}</p>
              <p className="text-xs text-indigo-400 mt-1.5 break-all">{url}</p>
            </div>

            <p className="text-xs text-gray-500 mb-2">
              Chaque personne défiée verra son positionnement comparé au tien, en tête-à-tête.
            </p>

            {/* Web Share — primary on mobile */}
            {hasWebShare && (
              <button
                onClick={handleWebShare}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors focus-ring flex items-center justify-center gap-2 mb-2"
              >
                {shared ? (
                  <><span aria-hidden="true">✓</span> Partagé !</>
                ) : (
                  <><span aria-hidden="true">📲</span> Partager le défi</>
                )}
              </button>
            )}

            {/* Direct app links */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappUrl(fullText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
              >
                <span className="text-base" aria-hidden="true">💬</span>
                <span>WhatsApp</span>
              </a>
              <a
                href={telegramUrl(fullText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
              >
                <span className="text-base" aria-hidden="true">✈️</span>
                <span>Telegram</span>
              </a>
              <a
                href={smsUrl(fullText)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
              >
                <span className="text-base" aria-hidden="true">💌</span>
                <span>SMS</span>
              </a>
              <a
                href={twitterUrl(CHALLENGE_TEXT)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
              >
                <span className="text-sm font-bold" aria-hidden="true">𝕏</span>
                <span>X / Twitter</span>
              </a>
              <button
                onClick={handleCopy}
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
              >
                <span aria-hidden="true">{copied ? '✅' : '📋'}</span>
                <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
