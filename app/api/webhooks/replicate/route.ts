// app/api/webhooks/replicate/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReplicatePayload = {
  id?: string;
  status?: string;
  input?: { jobId?: string | null } | null;
  output?: string[] | null;
  error?: any;
};

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'GET health' });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as ReplicatePayload;

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: true, ping: true });
    }

    const predictionId = payload.id || null;
    const status = payload.status || 'unknown';

    // 1) Пытаемся взять jobId из input, иначе ищем по prediction_id
    let jobId = payload.input?.jobId ?? null;
    if (!jobId && predictionId) {
      const { data, error } = await supabase
        .from('jobs')
        .select('id')
        .eq('prediction_id', predictionId)
        .maybeSingle();
      if (error) {
        return NextResponse.json(
          { ok: false, step: 'find_by_prediction', error: error.message },
          { status: 500 }
        );
      }
      jobId = data?.id ?? null;
    }

    if (!jobId) {
      return NextResponse.json(
        { ok: false, step: 'missing_jobId', payload },
        { status: 400 }
      );
    }

    // 2) Промежуточные статусы
    if (status !== 'succeeded' && status !== 'failed') {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);
      if (error) {
        return NextResponse.json(
          { ok: false, step: 'update_intermediate', error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, step: 'intermediate', jobId, status });
    }

    // 3) Success: сохраняем картинки
    if (status === 'succeeded') {
      const output = Array.isArray(payload.output) ? payload.output : [];
      const rows = output.map((url) => ({ job_id: jobId!, url }));

      if (rows.length) {
        const { error } = await supabase.from('images').insert(rows);
        if (error) {
          return NextResponse.json(
            { ok: false, step: 'insert_images', error: error.message },
            { status: 500 }
          );
        }
      }

      const { error: updErr } = await supabase
        .from('jobs')
        .update({ status: 'succeeded', done: rows.length })
        .eq('id', jobId);
      if (updErr) {
        return NextResponse.json(
          { ok: false, step: 'final_update', error: updErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, step: 'done', jobId, saved: rows.length });
    }

    // 4) Failed
    const errText =
      typeof payload.error === 'string'
        ? payload.error
        : JSON.stringify(payload.error || {});
    const { error: failErr } = await supabase
      .from('jobs')
      .update({ status: 'failed', error: errText })
      .eq('id', jobId);
    if (failErr) {
      return NextResponse.json(
        { ok: false, step: 'mark_failed', error: failErr.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, step: 'failed_saved', jobId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, step: 'handler_catch', error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

