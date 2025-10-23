// app/api/webhooks/replicate/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'GET health' });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    // Ничего не делаем, просто эхо-ответ
    return NextResponse.json({
      ok: true,
      received: payload || null,
    });
  } catch (e: any) {
    // На случай очень раннего крэша
    return NextResponse.json(
      { ok: false, step: 'stub_catch', error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

