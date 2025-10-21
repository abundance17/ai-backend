// app/api/webhooks/replicate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const id = body?.input?.jobId;
  const status = body?.status;
  const output = body?.output;

  if (!id) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  await supabase
    .from("jobs")
    .update({
      status,
      output,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (status === "succeeded" && Array.isArray(output)) {
    for (const url of output) {
      await supabase.from("images").insert({
        job_id: id,
        url,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

