// app/jobs/[id]/page.tsx
import { supabase } from '@/lib/supabaseServer';
import Image from 'next/image';

// ✅ Ключевой фикс — params теперь Promise<{ id: string }>
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // 👈 обязательно await

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('job_id', id);

  if (!job) {
    return <div className="p-6 text-center">Job not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Job status: {job.status}</h1>
      {job.status === 'succeeded' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images?.map((img) => (
            <Image
              key={img.id}
              src={img.url}
              alt="Generated"
              width={300}
              height={300}
              className="rounded-xl"
            />
          ))}
        </div>
      ) : (
        <p>Processing...</p>
      )}
    </div>
  );
}

