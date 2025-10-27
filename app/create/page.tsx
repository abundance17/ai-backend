// app/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateJobPage({
  searchParams,
}: {
  searchParams?: { userId?: string };
}) {
  const router = useRouter();
  const userId = searchParams?.userId || '';

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [tier, setTier] = useState<'fast' | 'standard' | 'pro'>('standard');
  const [numOutputs, setNumOutputs] = useState(8);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier, prompt, negativePrompt, numOutputs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      router.push(`/jobs/${json.jobId}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Новая задача</h1>
      {!userId && <p className="text-sm text-red-600 mb-2">Добавь ?userId=... в URL</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full border rounded-md p-2"
          placeholder="Prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-md p-2"
          placeholder="Negative prompt (optional)"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
        />
        <div className="flex gap-3">
          <label className="flex items-center gap-2">
            Tier:
            <select
              className="border rounded-md p-1"
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
            >
              <option value="fast">fast</option>
              <option value="standard">standard</option>
              <option value="pro">pro</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            num_outputs:
            <input
              type="number"
              min={1}
              max={16}
              className="border rounded-md p-1 w-20"
              value={numOutputs}
              onChange={(e) => setNumOutputs(Number(e.target.value))}
            />
          </label>
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button
          type="submit"
          disabled={!userId || loading}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Запуск…' : 'Запустить'}
        </button>
      </form>
    </main>
  );
}

