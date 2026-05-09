import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ id: string }> };

export default async function LegacyPreviewBlogPostRoute({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/blog/${id}/preview`);
}
