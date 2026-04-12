import { useState, useCallback } from 'react';
import type { CompassPosition } from '@partiprism/shared';
import { buildChallengeUrl } from '@/utils/challenge';

interface ChallengeButtonProps {
  userPosition: CompassPosition;
}

export function ChallengeButton({ userPosition }: ChallengeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleChallenge = useCallback(() => {
    const url = buildChallengeUrl(userPosition);
    const text = 'Je viens de tester mon positionnement politique en 5 axes sur PartiPrism — relève le défi et compare nos résultats !';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Défi PartiPrism', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {});
    }
  }, [userPosition]);

  return (
    <button
      onClick={handleChallenge}
      aria-label="Défier quelqu'un sur PartiPrism"
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-ring bg-indigo-900/60 hover:bg-indigo-800/70 text-indigo-200 border border-indigo-700/50"
    >
      <span aria-hidden="true">⚡</span>
      <span className="hidden sm:inline">{copied ? 'Lien copié !' : 'Défi'}</span>
    </button>
  );
}
