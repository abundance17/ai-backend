// app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    // Аккуратно вытаскиваем id из URL без второго аргумента
    const url = new URL(req.url);
    // Берём последний непустой сегмент пути: /api/jobs/<id>
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobErr) {
      return NextResponse.json({ ok: false, error: jobErr.message }, { status: 500 });
    }
    if (!job) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    const { data: imgs, error: imgErr } = await supabase
      .from('images')
      .select('url, thumb_url, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    if (imgErr) {
      return NextResponse.json({ ok: false, error: imgErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, job, images: imgs ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
