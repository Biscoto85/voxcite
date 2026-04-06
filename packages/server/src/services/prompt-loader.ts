/**
 * Charge le prompt actif depuis la DB, avec fallback sur le hardcodé.
 * Les prompts utilisent {{variable}} comme placeholders.
 */
import { db } from '../db/index.js';
import { prompts } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

// Cache en mémoire (5 min TTL) pour éviter une requête DB à chaque appel
const cache = new Map<string, { content: string; loadedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Charge le prompt actif pour une clé donnée.
 * Retourne null si aucun prompt actif en DB (le service utilisera son fallback hardcodé).
 */
export async function loadPrompt(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.content;
  }

  try {
    const [active] = await db
      .select({ content: prompts.content })
      .from(prompts)
      .where(and(eq(prompts.key, key), eq(prompts.isActive, true)));

    if (active) {
      cache.set(key, { content: active.content, loadedAt: Date.now() });
      return active.content;
    }
  } catch (err) {
    console.error(`[prompt-loader] Failed to load prompt '${key}':`, err);
  }

  return null;
}

/**
 * Remplace les {{placeholders}} dans un template de prompt.
 */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Invalide le cache pour forcer un rechargement depuis la DB.
 */
export function invalidatePromptCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
