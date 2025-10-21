// lib/replicate.ts
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function createPrediction({
  tier,
  webhook,
  input,
}: {
  tier: "fast" | "standard" | "pro";
  webhook: string;
  input: Record<string, any>;
}) {
  const versionKey = {
    fast: process.env.REPLICATE_VERSION_FAST!,
    standard: process.env.REPLICATE_VERSION_STANDARD!,
    pro: process.env.REPLICATE_VERSION_PRO!,
  }[tier];

  if (!versionKey) throw new Error(`Missing model version for tier ${tier}`);

  // передаём jobId, чтобы webhook мог понять, к какому job относится
  input.jobId = input.jobId || crypto.randomUUID();

  console.log("🚀 Creating prediction with:", { tier, versionKey, input, webhook });

  const prediction = await replicate.predictions.create({
    version: versionKey,
    input,
    webhook,
    webhook_events_filter: ["completed"],
  });

  if (!prediction || prediction.error) {
    console.error("Replicate prediction error:", prediction);
    throw new Error("Replicate error");
  }

  return prediction;
}

