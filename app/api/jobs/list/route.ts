// app/api/jobs/list/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    }

    const { data: jobRows, error: jobsErr } = await supabase
      .from('jobs')
      .select('id, status, done, total, prompt, tier, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (jobsErr) return NextResponse.json({ ok: false, error: jobsErr.message }, { status: 500 });
    if (!jobRows?.length) return NextResponse.json({ ok: true, items: [] });

    const ids = jobRows.map(j => j.id);
    const { data: imgs, error: imgsErr } = await supabase
      .from('images')
      .select('job_id, url, created_at')
      .in('job_id', ids)
      .order('created_at', { ascending: true });

    if (imgsErr) return NextResponse.json({ ok: false, error: imgsErr.message }, { status: 500 });

    const firstByJob = new Map<string, string>();
    (imgs || []).forEach(i => { if (!firstByJob.has(i.job_id)) firstByJob.set(i.job_id, i.url); });

    const items = jobRows.map(j => ({
      id: j.id,
      status: j.status,
      done: j.done ?? 0,
      total: j.total ?? 0,
      prompt: j.prompt,
      tier: j.tier,
      createdAt: j.created_at,
      firstUrl: firstByJob.get(j.id) || null,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
