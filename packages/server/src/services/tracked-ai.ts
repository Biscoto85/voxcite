/**
 * Wrapped Anthropic client that logs every API call to the api_calls table.
 * Use this instead of importing Anthropic directly.
 */
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/index.js';
import { apiCalls } from '../db/schema.js';

// Cost per million tokens (USD) — update when pricing changes
const COST_PER_M: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_M[model] || { input: 3, output: 15 }; // default to Sonnet pricing
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

interface TrackedCallOptions {
  promptKey: string;
  model: string;
  messages: Anthropic.MessageParam[];
  maxTokens: number;
  system?: string;
}

export async function trackedAiCall({ promptKey, model, messages, maxTokens, system }: TrackedCallOptions): Promise<Anthropic.Message> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const start = Date.now();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    });

    const durationMs = Date.now() - start;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    // Log to DB (fire and forget)
    db.insert(apiCalls).values({
      promptKey,
      model,
      inputTokens,
      outputTokens,
      costEstimate: estimateCost(model, inputTokens, outputTokens),
      durationMs,
      success: true,
    }).catch((err) => console.error('[tracked-ai] Failed to log API call:', err));

    return response;
  } catch (err: any) {
    const durationMs = Date.now() - start;

    // Log failure
    db.insert(apiCalls).values({
      promptKey,
      model,
      durationMs,
      success: false,
      errorMessage: err.message || 'Unknown error',
    }).catch(() => {});

    throw err;
  }
}
