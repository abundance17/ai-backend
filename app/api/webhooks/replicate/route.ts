import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🪄 Webhook received:", body);

    const jobId = body?.input?.jobId;
    const status = body?.status;
    const output = body?.output;

    if (!jobId) {
      console.error("❌ Missing jobId in webhook payload:", body);
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // 1️⃣ Обновляем статус job
    await supabase
      .from("jobs")
      .update({
        status,
        output,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 2️⃣ Если есть картинки — сохраняем в таблицу images
    if (status === "succeeded" && Array.isArray(output)) {
      for (const url of output) {
        await supabase.from("images").insert({
          job_id: jobId,
          url,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("🔥 Webhook error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

