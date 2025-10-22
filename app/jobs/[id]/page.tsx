'use client';

import { useEffect, useState } from 'react';

type Job = {
  id: string;
  status: string;
  error?: string | null;
  done?: number | null;
};

type ImageRow = { url: string };

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { id } = await params; // Next 15: params — Promise
        // без строгой uuid-валидации
        if (!id || typeof id !== 'string') throw new Error('Bad job id');

        const fetchOnce = async () => {
          const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
          if (!res.ok) {
            const t = await res.text();
            throw new Error(t || 'Failed to load job');
          }
          const data = await res.json();
          if (!mounted) return;
          setJob(data.job);
          setImages(data.images || []);
          setErr(null);

          if (data.job?.status && !['succeeded', 'failed', 'canceled'].includes(data.job.status)) {
            // ещё не финал — подождём и дернём ещё раз
            setTimeout(fetchOnce, 2500);
          }
        };

        await fetchOnce();
      } catch (e: any) {
        if (!mounted) return;
        setErr(e.message || 'Load error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  if (loading) return <main className="p-6"><h1 className="text-2xl font-bold">Задача: загрузка…</h1></main>;

  if (err) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Ошибка</h1>
        <div className="text-red-600 whitespace-pre-wrap">{err}</div>
        <a className="underline" href="/generate">← Вернуться к генерации</a>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Задача не найдена</h1>
        <a className="underline" href="/generate">← Вернуться к генерации</a>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Job status: {job.status}</h1>
      {job.error && <div className="text-red-600">Error: {job.error}</div>}

      {images.length === 0 && job.status !== 'succeeded' && <div>Processing…</div>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((im, i) => (
            <img key={i} src={im.url} alt={`out-${i}`} className="w-full h-auto rounded border" />
          ))}
        </div>
      )}

      <a className="underline" href="/generate">← Новая генерация</a>
    </main>
  );
}

