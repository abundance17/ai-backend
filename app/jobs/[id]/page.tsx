import { supabase } from '@/lib/supabaseServer';

export const revalidate = 0;

async function getData(id: string) {
  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single();
  const { data: images } = await supabase.from('images').select('*').eq('job_id', id).order('created_at');
  return { job, images: images || [] };
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const { job, images } = await getData(params.id);
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Задача #{params.id}</h1>
      <div className="text-sm">Статус: <span className="font-mono">{job.status}</span> ({job.done}/{job.total})</div>
      {job.error && <div className="text-red-600">Ошибка: {job.error}</div>}

      {images.length === 0 ? (
        <div className="text-gray-500">Изображения появятся после завершения генерации. Обнови страницу через 10–20 сек.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img: any) => (
            <img key={img.id} src={img.url} alt="" className="w-full h-auto rounded border" />
          ))}
        </div>
      )}
    </main>
  );
}

