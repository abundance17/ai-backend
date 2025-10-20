'use client';

import { useState } from 'react';

const PRESETS = [
  {
    id: 'fast',
    name: '⚡ FAST (SDXL Lightning)',
    prompt: 'A clear portrait of the provided person, smiling, front-facing, studio lighting, professional yet casual look, plain background, realistic, 8k uhd, sharp focus',
    negative: 'blurry, distorted face, extra arms, text, watermark, low quality',
  },
  {
    id: 'standard',
    name: '⭐ STANDARD (SDXL)',
    prompt: 'Photorealistic professional headshot of the provided person, neutral gray background, softbox studio lighting, sharp focus, natural skin tones, wearing a suit jacket, corporate look, 85mm lens, shallow depth of field, cinematic grading',
    negative: 'blurry, cartoon, text, watermark, distorted face',
  },
  {
    id: 'pro',
    name: '🎬 PRO Cinematic (FLUX 1.1 Pro)',
    prompt: 'Cinematic portrait of the provided person, dramatic lighting, detailed skin, volumetric light, high dynamic range, 35mm lens look, film grain, color graded',
    negative: 'blurry, text, watermark, low detail, distorted anatomy',
  },
] as const;

export default function GeneratePage() {
  const [tier, setTier] = useState<'fast'|'standard'|'pro'>('fast');
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [negative, setNegative] = useState(PRESETS[0].negative);
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSelect = (id: 'fast'|'standard'|'pro') => {
    setTier(id);
    const p = PRESETS.find(x => x.id === id)!;
    setPrompt(p.prompt);
    setNegative(p.negative);
  };

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, prompt, negativePrompt: negative, numOutputs: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setJobId(data.jobId);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🎨 Генерация AI-Аватара</h1>

      <div className="space-x-2">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`px-3 py-2 rounded border ${tier === p.id ? 'bg-black text-white' : ''}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="block">
        <div className="font-medium mb-1">Prompt</div>
        <textarea className="w-full border rounded p-3" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </label>

      <label className="block">
        <div className="font-medium mb-1">Negative prompt</div>
        <textarea className="w-full border rounded p-3" rows={3} value={negative} onChange={e=>setNegative(e.target.value)} />
      </label>

      <label className="block">
        <div className="font-medium mb-1">Количество изображений</div>
        <input type="number" min={1} max={16} className="border rounded p-2" value={count} onChange={e=>setCount(Number(e.target.value || 8))}/>
      </label>

      <button disabled={loading} onClick={submit} className="px-4 py-2 rounded bg-black text-white">
        {loading ? 'Генерируется...' : 'Создать задачу'}
      </button>

      {err && <div className="text-red-600">{err}</div>}
      {jobId && (
        <div className="p-3 border rounded">
          Задача создана. Перейти: <a className="underline" href={`/jobs/${jobId}`}>/jobs/{jobId}</a>
        </div>
      )}
    </main>
  );
}

