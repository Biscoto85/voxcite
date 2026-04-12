import { useState, useCallback, useMemo } from 'react';
import type { CompassPosition, Party } from '@partiprism/shared';
import {
  buildFullShareMessage,
  buildEmailData,
  whatsappUrl,
  telegramUrl,
  smsUrl,
  emailUrl,
  twitterUrl,
  buildSharePhrase,
} from '@/utils/share';
import { getClosestParty } from '@/utils/scoring';
import { buildChallengeUrl } from '@/utils/challenge';

interface SharePanelProps {
  userPosition: CompassPosition;
  parties: Party[];
}

const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const LS_SHARE_COUNT = 'partiprism_share_count';

export function incrementShareCount(): void {
  try {
    const current = parseInt(localStorage.getItem(LS_SHARE_COUNT) || '0', 10);
    localStorage.setItem(LS_SHARE_COUNT, String(current + 1));
  } catch { /* ignore */ }
}

export function getShareCount(): number {
  try {
    return parseInt(localStorage.getItem(LS_SHARE_COUNT) || '0', 10);
  } catch {
    return 0;
  }
}

export function SharePanel({ userPosition, parties }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);

  const closest = useMemo(() => getClosestParty(userPosition, parties), [userPosition, parties]);
  const message = useMemo(() => buildFullShareMessage(userPosition, parties), [userPosition, parties]);
  const shortPhrase = useMemo(() => buildSharePhrase(userPosition, closest), [userPosition, closest]);
  const emailData = useMemo(() => buildEmailData(userPosition, parties), [userPosition, parties]);

  const handleWebShare = useCallback(() => {
    if (!navigator.share) return;
    navigator.share({
      title: 'Mon positionnement PartiPrism',
      text: message,
    }).then(() => {
      incrementShareCount();
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    }).catch(() => {});
  }, [message]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      incrementShareCount();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }, [message]);

  const handleChallenge = useCallback(() => {
    const url = buildChallengeUrl(userPosition);
    const text = 'Je viens de tester mon positionnement politique en 5 axes sur PartiPrism — relève le défi et compare nos résultats !';
    if (navigator.share) {
      navigator.share({ title: 'Défi PartiPrism', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setChallengeCopied(true);
        setTimeout(() => setChallengeCopied(false), 2500);
      }).catch(() => {});
    }
  }, [userPosition]);

  return (
    <div className="space-y-4">
      {/* Message preview */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ton message personnalisé</p>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{message}</p>
      </div>

      {/* Web Share API — primary on mobile (covers WhatsApp, Signal, Messages, Email, AirDrop...) */}
      {hasWebShare && (
        <button
          onClick={handleWebShare}
          className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-medium text-sm transition-colors focus-ring flex items-center justify-center gap-2"
        >
          {shared ? (
            <><span aria-hidden="true">✓</span> Partagé !</>
          ) : (
            <><span aria-hidden="true">📲</span> Partager (WhatsApp, Signal, Messages…)</>
          )}
        </button>
      )}

      {/* Direct app links — always shown as quick access */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accès direct</p>
        <div className="grid grid-cols-2 gap-2">
          {/* WhatsApp */}
          <a
            href={whatsappUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={incrementShareCount}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">💬</span>
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={telegramUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={incrementShareCount}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">✈️</span>
            <span>Telegram</span>
          </a>

          {/* SMS */}
          <a
            href={smsUrl(message)}
            onClick={incrementShareCount}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">💌</span>
            <span>SMS / iMessage</span>
          </a>

          {/* Email */}
          <a
            href={emailUrl(emailData.subject, emailData.body)}
            onClick={incrementShareCount}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">📧</span>
            <span>Email</span>
          </a>

          {/* Twitter / X */}
          <a
            href={twitterUrl(shortPhrase)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={incrementShareCount}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-base font-bold" aria-hidden="true">𝕏</span>
            <span>X / Twitter</span>
          </a>

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
          </button>
        </div>
      </div>

      {/* Signal note — only on desktop where Web Share is unavailable */}
      {!hasWebShare && (
        <p className="text-xs text-gray-600 text-center">
          Sur téléphone, le bouton "Partager" propose aussi Signal, WhatsApp et tous tes contacts.
        </p>
      )}

      {/* Défi */}
      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Défi</p>
        <button
          onClick={handleChallenge}
          className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-xl text-sm text-indigo-200 transition-colors focus-ring"
        >
          <span className="text-lg" aria-hidden="true">⚡</span>
          <div className="text-left">
            <p className="font-medium">{challengeCopied ? 'Lien copié !' : 'Défier quelqu\'un'}</p>
            <p className="text-xs text-indigo-400/70">Partage ton positionnement et compare vos résultats</p>
          </div>
        </button>
      </div>
    </div>
  );
}
