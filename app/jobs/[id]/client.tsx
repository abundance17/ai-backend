// app/jobs/[id]/client.tsx
'use client';

import { useEffect, useState } from 'react';

type Job = {
  id: string;
  status: 'queued' | 'starting' | 'processing' | 'succeeded' | 'failed';
  output_urls: string[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
};

export default function JobClient({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Поллинг /api/jobs/[id] каждые 3 секунды до финального статуса
  useEffect(() => {
    let timer: any;

    const load = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load job');

        setJob(data.job);
        setErr(null);

        const st: Job['status'] | undefined = data.job?.status;
        const finished = st === 'succeeded' || st === 'failed';
        if (!finished) {
          timer = setTimeout(load, 3000);
        }
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => timer && clearTimeout(timer);
  }, [id]);

  if (loading && !job) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Job status: loading…</h1>
        <p>Processing...</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Ошибка</h1>
        <p className="text-red-600">{err}</p>
        <div className="mt-6">
          <a href="/generate" className="underline">← Вернуться к генерации</a>
        </div>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Job status: {job.status}</h1>

      {job.status === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">
          {job.error_message || 'Generation failed'}
        </div>
      )}

      {job.output_urls?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {job.output_urls.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer">
              <img
                src={u}
                alt={`img-${i}`}
                className="w-full h-auto rounded border"
              />
            </a>
          ))}
        </div>
      ) : (
        <p>Ожидаем результаты…</p>
      )}

      <div className="mt-6">
        <a href="/generate" className="underline">← Вернуться к генерации</a>
      </div>
    </main>
  );
}

