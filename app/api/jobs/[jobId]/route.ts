// app/api/jobs/[jobId]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> }
) {
  let jobId = '';
  try {
    const p = await ctx.params;
    jobId = p?.jobId || '';
    if (!jobId) {
      return NextResponse.json({ ok: false, error: 'bad_job_id' }, { status: 400 });
    }

    const { data: job, error: jerr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jerr && (jerr as any).code === 'PGRST116') {
      return NextResponse.json({ ok: false, error: 'job_not_found' }, { status: 404 });
    }
    if (jerr) throw new Error(`db_select_job: ${jerr.message}`);

    const { data: images, error: ierr } = await supabase
      .from('images')
      .select('url')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (ierr) throw new Error(`db_select_images: ${ierr.message}`);

    return new NextResponse(
      JSON.stringify({ ok: true, job, images: images ?? [] }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (e: any) {
    console.error('GET /api/jobs/[jobId] error ->', jobId, e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'internal_error' },
      { status: 500 }
    );
  }
}

