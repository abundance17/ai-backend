import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const payload = await req.json(); // { id, status, output?: string[] }
    const predictionId = payload?.id as string | undefined;
    if (!predictionId) return NextResponse.json({ ok: true });

    // Находим job
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('prediction_id', predictionId)
      .limit(1);

    const job = jobs?.[0];
    if (!job) return NextResponse.json({ ok: true });

    if (payload.status === 'succeeded' && Array.isArray(payload.output)) {
      const rows = payload.output.map((url: string) => ({ job_id: job.id, url }));
      if (rows.length) await supabase.from('images').insert(rows);
      await supabase.from('jobs').update({ status: 'succeeded', done: rows.length }).eq('id', job.id);
    } else if (payload.status === 'failed') {
      await supabase.from('jobs').update({ status: 'failed', error: payload?.error || 'failed' }).eq('id', job.id);
    } else {
      await supabase.from('jobs').update({ status: payload.status }).eq('id', job.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'webhook error' }, { status: 200 });
  }
}

