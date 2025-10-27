// app/api/webhooks/replicate/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { jobs, images } from '@/lib/schema';
import { revalidateTag } from 'next/cache';

function constantTimeEqual(a: string, b: string) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// HMAC-SHA256(rawBody, secret). Replicate шлёт X-Replicate-Signature: sha256=<hex>
// Поддержим и формат 't=...,s=...' на всякий случай.
function verifyReplicateSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret?: string
) {
  if (!secret) return false;
  if (!signatureHeader) return false;

  const header = signatureHeader.trim();
  let provided = header;

  // Вариант 't=...,s=...'
  if (header.includes('s=')) {
    const part = header.split(',').find((p) => p.trim().startsWith('s='));
    if (part) provided = part.trim().slice(2);
  }

  // Вариант 'sha256=<hex>'
  if (provided.startsWith('sha256=')) {
    provided = provided.slice('sha256='.length);
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return constantTimeEqual(provided, expected);
}

export async function POST(req: Request) {
  // 1) читаем сырое тело ДО парсинга
  const raw = await req.text();

  const sig =
    req.headers.get('x-replicate-signature') ||
    req.headers.get('replicate-signature') ||
    req.headers.get('x-signature');

  const ok = verifyReplicateSignature(raw, sig, process.env.REPLICATE_WEBHOOK_SECRET);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  // 2) теперь парсим JSON
  let payload: any = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const predictionId: string | null = payload?.id ?? null;
  const jobId: string | null = payload?.input?.jobId ?? null;
  const status: string = String(payload?.status ?? 'processing').toLowerCase();
  const out: string[] = Array.isArray(payload?.output) ? payload.output : [];

  if (!jobId) {
    return NextResponse.json({ ok: false, step: 'missing_jobId', payload }, { status: 400 });
  }

  // найдём job
  const rows = await db.select().from(jobs).where(jobs.id.eq(jobId)).limit(1);
  const job = rows?.[0];
  if (!job) {
    return NextResponse.json({ ok: false, step: 'job_not_found', jobId }, { status: 404 });
  }
  if (['succeeded', 'failed', 'canceled'].includes(job.status)) {
    return NextResponse.json({ ok: true, step: 'already_terminal', jobId, status: job.status });
  }

  if (status === 'succeeded') {
    const unique = Array.from(new Set(out.filter(Boolean)));
    if (unique.length) {
      await db
        .insert(images)
        .values(unique.map((url) => ({ jobId, url })))
        .onConflictDoNothing(); // требует уникальный индекс (см. ниже)
    }

    await db
      .update(jobs)
      .set({
        status: 'succeeded',
        predictionId,
        done: (job.done ?? 0) + (unique.length || 0),
        processedAt: new Date(),
      })
      .where(jobs.id.eq(jobId));

    try {
      revalidateTag(`job:${jobId}`);
    } catch {}

    return NextResponse.json({ ok: true, step: 'done', jobId, saved: unique.length });
  }

  if (status === 'failed' || status === 'canceled') {
    await db
      .update(jobs)
      .set({
        status,
        predictionId,
        error: payload?.error ?? null,
        processedAt: new Date(),
      })
      .where(jobs.id.eq(jobId));

    try {
      revalidateTag(`job:${jobId}`);
    } catch {}
    return NextResponse.json({ ok: true, step: 'terminal', jobId, status });
  }

  // промежуточные статусы
  await db.update(jobs).set({ status, predictionId }).where(jobs.id.eq(jobId));
  return NextResponse.json({ ok: true, step: 'progress', jobId, status });
}

