import type { AxisId, CompassPosition } from '@partiprism/shared';

export const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

/** Clamp value between min and max */
export function clamp(val: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

/** Strip markdown code fences from Claude responses */
export function extractJSON(raw: string): string {
  return raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/** Validate UUID v4 format */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/** Validate that a URL uses http/https protocol */
export function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Safely extract text from Claude API response */
export function extractClaudeText(response: { content: Array<{ type: string; text?: string }> }): string {
  return response.content[0]?.type === 'text' ? response.content[0].text ?? '' : '';
}

/** Parse Claude JSON response (strip fences + parse) */
export function parseClaudeJSON<T>(response: { content: Array<{ type: string; text?: string }> }): T {
  const raw = extractClaudeText(response);
  return JSON.parse(extractJSON(raw));
}
