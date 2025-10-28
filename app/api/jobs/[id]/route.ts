import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Extract the dynamic route ID by awaiting the params
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  // Use the `id` to query your database (e.g., Supabase or MongoDB)...
  const { data: job, error: jobErr } = await supabase.from('jobs').select('*').eq('id', id).single();
  if (jobErr) {
    return NextResponse.json({ ok: false, error: jobErr.message }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  // (Optional) Fetch related images using the job ID...
  const { data: imgs, error: imgErr } = await supabase.from('images')
    .select('url, thumb_url, created_at')
    .eq('job_id', id)
    .order('created_at', { ascending: true });

  if (imgErr) {
    return NextResponse.json({ ok: false, error: imgErr.message }, { status: 500 });
  }

  // Return the response JSON with job and images data
  return NextResponse.json({ ok: true, job, images: imgs ?? [] });
}
