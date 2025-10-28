// app/api/webhooks/replicate/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseServer';
import { revalidateTag } from 'next/cache';

function constantTimeEqual(a: string, b: string) {
  const A = Buffer.from(a, 'utf8');
  const B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

// Поддержка 'sha256=<hex>' и 't=...,s=...'
function verifyReplicateSignature(raw: string, sigHeader: string | null, secret?: string) {
  if (!secret || !sigHeader) return false;
  let provided = sigHeader.trim();
  if (provided.includes('s=')) {
    const part = provided.split(',').find(p => p.trim().startsWith('s='));
    if (part) provided = part.trim().slice(2);
  }
  if (provided.startsWith('sha256=')) provided = provided.slice('sha256='.length);
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return constantTimeEqual(provided, expected);
}

export async function POST(req: Request) {
  // 1) читаем сырое тело ДО парсинга — иначе HMAC не сойдётся
  const raw = await req.text();
  const sig =
    req.headers.get('x-replicate-signature') ||
    req.headers.get('replicate-signature') ||
    req.headers.get('x-signature');

  const ok = verifyReplicateSignature(raw, sig, process.env.REPLICATE_WEBHOOK_SECRET);
  if (!ok) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });

  // 2) парсим JSON
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const predictionId: string | null = payload?.id ?? null;
  const jobId: string | null = payload?.input?.jobId ?? null;
  const status: string = String(payload?.status ?? 'processing').toLowerCase();
  const output: string[] = Array.isArray(payload?.output) ? payload.output : [];

  if (!jobId) return NextResponse.json({ ok: false, step: 'missing_jobId', payload }, { status: 400 });

  // 3) ищем job
  const { data: job, error: jobErr } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  if (jobErr) return NextResponse.json({ ok: false, error: jobErr.message }, { status: 500 });
  if (!job) return NextResponse.json({ ok: false, step: 'job_not_found', jobId }, { status: 404 });
  if (['succeeded', 'failed', 'canceled'].includes(job.status)) {
    return NextResponse.json({ ok: true, step: 'already_terminal', jobId, status: job.status });
  }

  // 4) успешный финал
  if (status === 'succeeded') {
    const unique = Array.from(new Set(output.filter(Boolean)));
    if (unique.length) {
      // Требуется уникальный индекс (job_id, url). Если он есть — используем upsert ignore.
      await supabase
        .from('images')
        .upsert(
          unique.map((url) => ({ job_id: jobId, url })),
          { onConflict: 'job_id,url', ignoreDuplicates: true }
        );
    }

    await supabase
      .from('jobs')
      .update({
        status: 'succeeded',
        prediction_id: predictionId,
        done: (job.done ?? 0) + (unique.length || 0),
        processed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    try { revalidateTag(`job:${jobId}`); } catch {}
    return NextResponse.json({ ok: true, step: 'done', jobId, saved: unique.length });
  }

  // 5) неуспех
  if (status === 'failed' || status === 'canceled') {
    await supabase
      .from('jobs')
      .update({
        status,
        prediction_id: predictionId,
        error: payload?.error ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    try { revalidateTag(`job:${jobId}`); } catch {}
    return NextResponse.json({ ok: true, step: 'terminal', jobId, status });
  }

  // 6) промежуточные статусы
  await supabase.from('jobs').update({ status, prediction_id: predictionId }).eq('id', jobId);
  return NextResponse.json({ ok: true, step: 'progress', jobId, status });
}
