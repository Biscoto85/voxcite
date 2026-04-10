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

interface SharePanelProps {
  userPosition: CompassPosition;
  parties: Party[];
}

const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function SharePanel({ userPosition, parties }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

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
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    }).catch(() => {});
  }, [message]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }, [message]);

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
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">✈️</span>
            <span>Telegram</span>
          </a>

          {/* SMS */}
          <a
            href={smsUrl(message)}
            className="flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-200 transition-colors focus-ring"
          >
            <span className="text-lg" aria-hidden="true">💌</span>
            <span>SMS / iMessage</span>
          </a>

          {/* Email */}
          <a
            href={emailUrl(emailData.subject, emailData.body)}
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
    </div>
  );
}
