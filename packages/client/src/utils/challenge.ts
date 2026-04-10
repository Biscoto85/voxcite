import type { CompassPosition } from '@partiprism/shared';

/**
 * Encode a position into a compact URL-safe string for the #defi/ fragment.
 * Format: s{v}e{v}a{v}g{v}v{v} where each v is fixed to 2 decimal places.
 * Example: s0.42e-0.15a0.30g0.67v-0.20
 * The fragment is never sent to the server → full privacy by design.
 */
export function encodeChallenge(pos: CompassPosition): string {
  const f = (v: number) => v.toFixed(2);
  return `s${f(pos.societal)}e${f(pos.economic)}a${f(pos.authority)}g${f(pos.ecology)}v${f(pos.sovereignty)}`;
}

/**
 * Decode a challenge string back to a CompassPosition.
 * Returns null if the string is malformed or values are out of [-1, 1] range.
 */
export function decodeChallenge(encoded: string): CompassPosition | null {
  const match = encoded.match(
    /s(-?[\d.]+)e(-?[\d.]+)a(-?[\d.]+)g(-?[\d.]+)v(-?[\d.]+)/,
  );
  if (!match) return null;

  const [, sStr, eStr, aStr, gStr, vStr] = match;
  const [societal, economic, authority, ecology, sovereignty] =
    [sStr, eStr, aStr, gStr, vStr].map(Number);

  if ([societal, economic, authority, ecology, sovereignty].some(
    (x) => isNaN(x) || x < -1.01 || x > 1.01,
  )) return null;

  return {
    societal: Math.max(-1, Math.min(1, societal)),
    economic: Math.max(-1, Math.min(1, economic)),
    authority: Math.max(-1, Math.min(1, authority)),
    ecology: Math.max(-1, Math.min(1, ecology)),
    sovereignty: Math.max(-1, Math.min(1, sovereignty)),
  };
}

/** Build the full challenge URL including the #defi/ fragment */
export function buildChallengeUrl(pos: CompassPosition): string {
  return `${window.location.origin}/#defi/${encodeChallenge(pos)}`;
}

/** Parse #defi/... from the current window location. Returns null if not a challenge URL. */
export function parseChallengeFromHash(): CompassPosition | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#defi/')) return null;
  return decodeChallenge(hash.slice(6));
}
