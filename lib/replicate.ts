// lib/replicate.ts
export type Tier = 'fast' | 'standard' | 'pro';

const VERSION_BY_TIER: Record<Tier, string> = {
  fast: process.env.REPLICATE_VERSION_FAST!,        // format: model:version-hash
  standard: process.env.REPLICATE_VERSION_STANDARD!,
  pro: process.env.REPLICATE_VERSION_PRO!,          // может быть просто "black-forest-labs/flux-1.1-pro"
};

export async function createPrediction(opts: {
  tier: Tier;
  input: Record<string, any>;
  webhook: string;
}) {
  const version = VERSION_BY_TIER[opts.tier];
  if (!version) throw new Error(`Missing version for tier ${opts.tier}`);

  const resp = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: opts.input,
      webhook: opts.webhook,
      webhook_events_filter: ['completed'],
    }),
    // Replicate может отвечать медленнее, дадим запас
    next: { revalidate: 0 },
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || 'Replicate error');
  }
  return data as { id: string; status: string };
}

