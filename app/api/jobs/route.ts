// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';
import { createPrediction } from '@/lib/replicate';

const RATE_WINDOW_MS = 3000;

// --- GET /api/jobs?userId=... ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ ok:false, error:'Missing userId' }, { status:400 });
    }

    const { data: jobs, error: jobsErr } = await supabase
      .from('jobs')
      .select('id, status, done, total, prompt, tier, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending:false })
      .limit(50);

    if (jobsErr) return NextResponse.json({ ok:false, error: jobsErr.message }, { status:500 });
    if (!jobs?.length) return NextResponse.json({ ok:true, items: [] });

    const ids = jobs.map(j => j.id);
    const { data: imgs, error: imgsErr } = await supabase
      .from('images')
      .select('job_id, url, created_at')
      .in('job_id', ids)
      .order('created_at', { ascending:true });

    if (imgsErr) return NextResponse.json({ ok:false, error: imgsErr.message }, { status:500 });

    const firstByJob = new Map<string, string>();
    imgs?.forEach(i => { if (!firstByJob.has(i.job_id)) firstByJob.set(i.job_id, i.url); });

    const items = jobs.map(j => ({
      id: j.id,
      status: j.status,
      done: j.done ?? 0,
      total: j.total ?? 0,
      prompt: j.prompt,
      tier: j.tier,
      createdAt: j.created_at,
      firstUrl: firstByJob.get(j.id) || null,
    }));

    return NextResponse.json({ ok:true, items });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status:500 });
  }
}

// --- POST /api/jobs ---
export async function POST(req: Request) {
  const { userId, tier, prompt, negativePrompt, numOutputs = 8 } = await req.json();
  if (!userId || !tier || !prompt) {
    return NextResponse.json({ error:'Bad input' }, { status:400 });
  }

  // Rate limit 3s
  const { data: lastJobs } = await supabase
    .from('jobs')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending:false })
    .limit(1);

  const last = lastJobs?.[0];
  if (last) {
    const lastAt = new Date((last as any).created_at as string).getTime();
    const now = Date.now();
    if (now - lastAt < RATE_WINDOW_MS) {
      const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - lastAt))/1000);
      return NextResponse.json(
        { error:'Too many requests. Try again shortly.' },
        { status:429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
  }

  // create job
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      tier,
      prompt,
      negative_prompt: negativePrompt || '',
      status: 'queued',
      total: Number(numOutputs) || 8,
    })
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json({ error: error?.message || 'DB error' }, { status:500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const webhook = `${baseUrl}/api/webhooks/replicate`;

  const prediction = await createPrediction({
    tier: tier as 'fast' | 'standard' | 'pro',
    webhook,
    input: {
      jobId: (job as any).id,
      prompt,
      negative_prompt: negativePrompt || '',
      num_outputs: Number(numOutputs) || 8,
      width: 1024,
      height: 1024,
    },
  });

  await supabase
    .from('jobs')
    .update({ prediction_id: (prediction as any).id, status: (prediction as any).status })
    .eq('id', (job as any).id);

  return NextResponse.json({ ok:true, jobId: (job as any).id });
}
