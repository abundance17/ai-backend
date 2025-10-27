// app/jobs/[id]/page.tsx
import 'server-only';

type Params = { id: string };

// В Next 15 серверный Page получает params как Promise
export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  // Рендерим минимальный скелет и доверим клиентскому компоненту опрос API
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Job status: loading…</h1>
      <p>Processing...</p>
      {/* Клиентский виджет ниже подхватит id и начнёт пуллить */}
      <ClientJobView id={id} />
    </main>
  );
}

// Клиентский компонент, чтобы не трогать серверную типизацию
'use client';
import { useEffect, useState } from 'react';

function ClientJobView({ id }: { id: string }) {
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
  if (!state) return null;

  const { job, images } = state;
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold">
        Status: {job.status} {typeof job.done === 'number' && typeof job.total === 'number' ? `(${job.done}/${job.total})` : ''}
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

