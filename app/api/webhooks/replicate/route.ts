import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, output, input, error } = body;

    console.log("📩 Webhook received:", { id, status, error });

    // Проверим, есть ли jobId (мы передаём его в input)
    const jobId = input?.jobId;
    if (!jobId) {
      console.error("❌ Missing jobId in Replicate webhook input");
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Обновляем задачу в Supabase
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Если пришёл результат — добавляем его
    if (output && Array.isArray(output)) {
      updateData.output_urls = output;
    }

    // Если есть ошибка — тоже сохраняем
    if (error) {
      updateData.error_message = typeof error === "string" ? error : JSON.stringify(error);
    }

    const { error: supabaseError } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", jobId);

    if (supabaseError) {
      console.error("❌ Supabase update error:", supabaseError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log("✅ Job updated successfully:", { jobId, status });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}

