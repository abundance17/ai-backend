'use client';

import { useEffect, useState } from 'react';

export default function JobPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔁 функция для запроса статуса задачи
  async function fetchJob() {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      if (!res.ok) throw new Error('Ошибка при загрузке задачи');
      const data = await res.json();
      setJob(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 📡 автообновление каждые 5 секунд
  useEffect(() => {
    fetchJob(); // первый вызов
    const interval = setInterval(fetchJob, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-lg">Загрузка...</div>;
  if (error) return <div className="p-6 text-red-600">Ошибка: {error}</div>;
  if (!job) return <div className="p-6">Задача не найдена</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Job status: {job.status}</h1>

      {job.status !== 'succeeded' && (
        <p className="text-gray-600">⏳ Processing...</p>
      )}

      {job.status === 'succeeded' && job.output?.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {job.output.map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`AI Avatar ${i}`}
              className="rounded-xl border shadow"
            />
          ))}
        </div>
      )}

      {job.status === 'failed' && (
        <p className="text-red-600">❌ Ошибка при генерации</p>
      )}
    </main>
  );
}

