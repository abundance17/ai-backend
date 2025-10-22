// app/jobs/[id]/page.tsx

export const dynamic = 'force-dynamic'; // чтобы страницу не кешировало

import JobClient from './client';

// В Next.js 15 props.params — это Promise. Надо await.
export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // распаковываем id из промиса
  return <JobClient id={id} />;
}

