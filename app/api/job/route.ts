import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ ok: false, error: 'bad_job_id' }, { status: 400 });
    }

    const { data: job, error: jerr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    // PGRST116 = row not found (PostgREST)
    if (jerr && (jerr as any).code === 'PGRST116') {
      return NextResponse.json({ ok: false, error: 'job_not_found' }, { status: 404 });
    }
    if (jerr) throw new Error(jerr.message);

    const { data: images, error: ierr } = await supabase
      .from('images')
      .select('url')
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    if (ierr) throw new Error(ierr.message);

    return NextResponse.json({ ok: true, job, images: images ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'internal_error' }, { status: 500 });
  }
}

