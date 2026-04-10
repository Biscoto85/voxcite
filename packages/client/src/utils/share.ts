import type { CompassPosition, Party } from '@partiprism/shared';
import { getClosestParty } from './scoring';
import { buildChallengeUrl } from './challenge';

// ── Axis descriptors ──────────────────────────────────────────────────

type AxisKey = keyof CompassPosition;

const AXIS_LABEL: Record<AxisKey, (v: number) => string | null> = {
  societal:    (v) => v > 0.2 ? 'progressiste'       : v < -0.2 ? 'conservateur·trice' : null,
  economic:    (v) => v > 0.2 ? 'libéral·e'           : v < -0.2 ? 'interventionniste'  : null,
  authority:   (v) => v > 0.2 ? 'libertaire'          : v < -0.2 ? 'autoritaire'         : null,
  ecology:     (v) => v > 0.2 ? 'écologiste'          : v < -0.2 ? 'productiviste'       : null,
  sovereignty: (v) => v > 0.2 ? 'mondialiste'         : v < -0.2 ? 'souverainiste'       : null,
};

function computeIntensity(pos: CompassPosition): number {
  return [pos.societal, pos.economic, pos.authority, pos.ecology, pos.sovereignty]
    .reduce((s, v) => s + Math.abs(v), 0) / 5;
}

/** Top-3 axis labels sorted by absolute value */
export function getTop3Labels(pos: CompassPosition): string[] {
  const axes: AxisKey[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];
  return axes
    .map((k) => ({ key: k, abs: Math.abs(pos[k]) }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, 3)
    .map(({ key }) => AXIS_LABEL[key](pos[key]))
    .filter((l): l is string => l !== null);
}

function joinLabels(labels: string[]): string {
  if (labels.length === 0) return 'centriste sur tous les axes';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} et ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} et ${labels[2]}`;
}

// ── Public helpers ────────────────────────────────────────────────────

/** Short phrase for X / copy in CompassReveal */
export function buildSharePhrase(pos: CompassPosition, closest: Party | null): string {
  const labels = getTop3Labels(pos);
  const intensity = computeIntensity(pos);
  const tone = intensity > 0.55
    ? 'Des convictions bien tranchées — vous aussi ?'
    : 'Un positionnement plus nuancé qu\'il n\'y paraît.';
  const partyPart = closest ? `, proche de ${closest.label} sur 5 axes` : '';
  return `Je suis ${joinLabels(labels)}${partyPart}. ${tone} Mon vrai positionnement sur partiprism.fr`;
}

/**
 * Full invitation message — personalized, includes the challenge link
 * so the recipient arrives on the comparison view directly.
 */
export function buildFullShareMessage(pos: CompassPosition, parties: Party[]): string {
  const closest = getClosestParty(pos, parties);
  const labels = getTop3Labels(pos);
  const partyPart = closest ? ` — proche de ${closest.label}` : '';
  const challengeUrl = buildChallengeUrl(pos);

  return [
    `Je viens de découvrir mon vrai positionnement politique en 5 axes sur PartiPrism.`,
    ``,
    `Je suis ${joinLabels(labels)}${partyPart}. Plus nuancé qu'un simple "gauche ou droite".`,
    ``,
    `→ Fais le test et compare avec mon résultat : ${challengeUrl}`,
  ].join('\n');
}

/** Email subject + body for the mailto: link */
export function buildEmailData(pos: CompassPosition, parties: Party[]): { subject: string; body: string } {
  const closest = getClosestParty(pos, parties);
  const labels = getTop3Labels(pos);
  const partyPart = closest ? ` — proche de ${closest.label}` : '';
  const challengeUrl = buildChallengeUrl(pos);

  const subject = 'Mon positionnement politique en 5 axes — et toi ?';
  const body = [
    `Salut,`,
    ``,
    `Je viens de faire un test qui positionne en 5 axes politiques (pas juste gauche/droite).`,
    ``,
    `Mon résultat : je suis ${joinLabels(labels)}${partyPart}.`,
    ``,
    `C'est assez éclairant de voir sa position vs celle des partis.`,
    ``,
    `→ Fais-le et compare avec mon résultat : ${challengeUrl}`,
    ``,
    `(~5 min, anonyme, aucun compte requis)`,
  ].join('\n');

  return { subject, body };
}

// ── Platform URLs ─────────────────────────────────────────────────────

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function telegramUrl(text: string): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://partiprism.fr/';
  return `https://t.me/share/url?url=${encodeURIComponent(base)}&text=${encodeURIComponent(text)}`;
}

export function smsUrl(text: string): string {
  // Works on iOS and Android (& separator needed on Android for some versions)
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function emailUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function twitterUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
