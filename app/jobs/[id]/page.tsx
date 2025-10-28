// app/jobs/[id]/page.tsx
import 'server-only';
import ClientJobView from './ClientJobView';

type Params = { id: string };

// В Next 15 серверный Page получает params как Promise
export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Job status</h1>
      <ClientJobView id={id} />
    </main>
  );
}
