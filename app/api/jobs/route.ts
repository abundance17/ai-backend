import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPrediction } from "@/lib/replicate"; // убедись, что этот импорт указывает на твой helper

// Создаём Supabase client с ключами
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, negativePrompt, numOutputs, tier } = body;

    // Проверка переменных окружения
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error("❌ Missing NEXT_PUBLIC_BASE_URL");
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_BASE_URL in environment variables" },
        { status: 500 }
      );
    }

    // Создаём запись задачи в Supabase
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert([{ prompt, negative_prompt: negativePrompt || "", status: "created" }])
      .select()
      .single();

    if (jobError || !job) {
      console.error("❌ Supabase insert error:", jobError);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }

    // Формируем webhook URL
    const webhook = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/replicate`;
    console.log("✅ Webhook URL:", webhook);

    // Отправляем prediction в Replicate
    const prediction = await createPrediction({
      tier,
      webhook,
      input: {
        jobId: job.id, // 👈 важно — чтобы webhook знал, какую запись обновить
        prompt,
        negative_prompt: negativePrompt || "",
        num_outputs: Number(numOutputs) || 1,
        width: 1024,
        height: 1024,
      },
    });

    if (!prediction || !prediction.id) {
      console.error("❌ Replicate prediction creation failed");
      return NextResponse.json({ error: "Replicate prediction failed" }, { status: 500 });
    }

    // Обновляем задачу в Supabase
    await supabase
      .from("jobs")
      .update({ prediction_id: prediction.id, status: prediction.status })
      .eq("id", job.id);

    console.log("✅ Job created successfully:", job.id);

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (error: any) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

