// lib/replicate.ts
import Replicate from 'replicate';
import crypto from 'crypto';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

type Tier = 'fast' | 'standard' | 'pro';

export async function createPrediction({
  tier,
  webhook,
  input,
}: {
  tier: Tier;
  webhook: string;
  input: Record<string, any>;
}) {
  const versionKey = {
    fast: process.env.REPLICATE_VERSION_FAST!,
    standard: process.env.REPLICATE_VERSION_STANDARD!,
    pro: process.env.REPLICATE_VERSION_PRO!,
  }[tier];

  if (!versionKey) throw new Error(`Missing model version for tier ${tier}`);

  // гарантируем наличие jobId
  if (!input.jobId) input.jobId = crypto.randomUUID();

  // ВАЖНО: собираем options как any, чтобы обойти старые типы SDK
  const options: any = {
    version: versionKey,
    input,
    webhook,
    webhook_events_filter: ['completed'], // чтобы не спамил промежуточными
  };

  // Передаём секрет, если он задан в env (Vercel -> REPLICATE_WEBHOOK_SECRET)
  if (process.env.REPLICATE_WEBHOOK_SECRET) {
    options.webhook_secret = process.env.REPLICATE_WEBHOOK_SECRET;
  }

  const prediction = await replicate.predictions.create(options);

  if (!prediction || (prediction as any).error) {
    console.error('Replicate prediction error:', prediction);
    throw new Error('Replicate error');
  }

  return prediction;
}
