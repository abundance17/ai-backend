// app/api/jobs/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type JobRow = {
  id: string;
  status: string;
  output_urls: string[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
};

// ⬇⬇⬇ ВАЖНО: params — это Promise в Next.js 15
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // <-- распаковываем из промиса
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("id,status,output_urls,error_message,created_at,updated_at")
      .eq("id", id)
      .single<JobRow>();

    if (error || !data) {
      console.error("GET /api/jobs/[id] supabase error:", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ job: data }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/jobs/[id] fatal:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

