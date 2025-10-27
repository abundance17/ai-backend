// lib/replicate.ts
import Replicate from "replicate";
import crypto from "crypto";

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

  // safety: если вдруг не пришёл, добавим временный
  input.jobId = input.jobId || crypto.randomUUID();

  const webhook_secret = process.env.REPLICATE_WEBHOOK_SECRET!;
  if (!webhook_secret) throw new Error("REPLICATE_WEBHOOK_SECRET is missing");

  const prediction = await replicate.predictions.create({
    version: versionKey,
    input,
    webhook,
    webhook_events_filter: ["completed"], // чтобы не спамило промежуточными
    webhook_secret,
  });

  if (!prediction || (prediction as any).error) {
    console.error("Replicate prediction error:", prediction);
    throw new Error("Replicate error");
  }
  return prediction;
}

