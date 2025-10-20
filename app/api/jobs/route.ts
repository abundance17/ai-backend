import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';
import { createPrediction } from '@/lib/replicate';
import type { Tier } from '@/lib/replicate';

export async function POST(req: Request) {
  try {
    const { userId = null, tier, prompt, negativePrompt, numOutputs = 8 } = await req.json();

    if (!tier || !prompt) {
      return NextResponse.json({ error: 'Bad input' }, { status: 400 });
    }
    const t: Tier = tier;
    if (!['fast','standard','pro'].includes(t)) {
      return NextResponse.json({ error: 'Bad tier' }, { status: 400 });
    }

    // 1) Создаём запись job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        tier: t,
        prompt,
        negative_prompt: negativePrompt || null,
        status: 'queued',
        total: Number(numOutputs) || 8,
      })
      .select()
      .single();
    if (error || !job) throw new Error(error?.message || 'Failed to create job');

    // 2) Запускаем Replicate
    const webhook = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/replicate`;
    const prediction = await createPrediction({
      tier: t,
      webhook,
      input: {
        prompt,
        negative_prompt: negativePrompt || '',
        num_outputs: Number(numOutputs) || 8,
        width: 1024,
        height: 1024,
      },
    });

    await supabase
      .from('jobs')
      .update({ prediction_id: prediction.id, status: prediction.status })
      .eq('id', job.id);

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

