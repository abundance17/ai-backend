import Replicate from 'replicate';
import { randomUUID } from 'crypto';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

export async function createPrediction({
  tier, webhook, input,
}: {
  tier: 'fast' | 'standard' | 'pro';
  webhook: string;
  input: Record<string, any>;
}) {
  const versionKey = ({
    fast: process.env.REPLICATE_VERSION_FAST!,
    standard: process.env.REPLICATE_VERSION_STANDARD!,
    pro: process.env.REPLICATE_VERSION_PRO!,
  } as const)[tier];
  if (!versionKey) throw new Error(`Missing model version for tier ${tier}`);

  if (!input.jobId) input.jobId = randomUUID();

  const prediction = await replicate.predictions.create({
    version: versionKey,
    input,
    webhook,
    webhook_events_filter: ['completed'],
    webhook_secret: process.env.REPLICATE_WEBHOOK_SECRET, // <<< важно
  });

  if (!prediction || (prediction as any).error) throw new Error('Replicate error');
  return prediction;
}
