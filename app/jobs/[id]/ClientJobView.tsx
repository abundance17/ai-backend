// app/jobs/[id]/ClientJobView.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientJobView({ id }: { id: string }) {
  const [state, setState] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
        setState(data);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        t = setTimeout(tick, 2500);
      }
    };
    tick();
    return () => clearTimeout(t);
  }, [id]);

  if (err) return <div className="text-red-600">Ошибка: {err}</div>;
  if (!state) return <p>Loading…</p>;

  const { job, images } = state;
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold">
        Status: {job.status}{' '}
        {typeof job.done === 'number' && typeof job.total === 'number'
          ? `(${job.done}/${job.total})`
          : ''}
      </h2>

      {Array.isArray(images) && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {images.map((img: any, i: number) => (
            <img key={i} src={img.url} alt="" className="w-full h-auto rounded border" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-2">Ещё нет изображений…</p>
      )}
    </div>
  );
}
