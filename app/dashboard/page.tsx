// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { userId?: string };
}) {
  const userId = searchParams?.userId || '';
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let t: any;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed');
        setData(json);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        t = setTimeout(tick, 2500);
      }
    };
    tick();
    return () => clearTimeout(t);
  }, [userId]);

  if (!userId) return <main className="p-6">Добавь ?userId=... в URL</main>;
  if (err) return <main className="p-6 text-red-600">Ошибка: {err}</main>;
  if (!data) return <main className="p-6">Загрузка…</main>;

  const items = data.items || [];
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Мои задачи</h1>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Пока пусто.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it: any) => (
            <a key={it.id} href={`/jobs/${it.id}`} className="border rounded-xl p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                {it.firstUrl ? (
                  <img src={it.firstUrl} alt="" className="w-20 h-20 object-cover rounded-md" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-md" />
                )}
                <div className="flex-1">
                  <div className="text-sm text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
                  <div className="font-semibold">Status: {it.status}</div>
                  <div className="text-sm">
                    {typeof it.done === 'number' && typeof it.total === 'number'
                      ? `${it.done}/${it.total}`
                      : null}
                  </div>
                  <div className="text-sm line-clamp-2 mt-1 text-gray-600">{it.prompt}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}

