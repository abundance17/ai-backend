import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPrediction } from "@/lib/replicate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tier: t, prompt, negativePrompt, numOutputs } = await req.json();

    // 1️⃣ Создаём запись в таблице jobs
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        tier: t,
        prompt,
        negative_prompt: negativePrompt,
        num_outputs: numOutputs,
        status: "starting",
      })
      .select()
      .single();

    if (error || !job) throw new Error(error?.message || "Failed to insert job");

    // 2️⃣ Формируем webhook URL
    const webhook = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate`;

    // 3️⃣ Запускаем prediction в Replicate
    const prediction = await createPrediction({
      tier: t,
      webhook,
      input: {
        jobId: job.id, // 👈 вот откуда — из вставленной строки Supabase
        prompt,
        negative_prompt: negativePrompt || "",
        num_outputs: Number(numOutputs) || 8,
        width: 1024,
        height: 1024,
      },
    });

    // 4️⃣ Сохраняем id и статус prediction в Supabase
    await supabase
      .from("jobs")
      .update({
        prediction_id: prediction.id,
        status: prediction.status,
      })
      .eq("id", job.id);

    // 5️⃣ Отдаём jobId фронту
    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (e: any) {
    console.error("🚨 Job creation error:", e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

