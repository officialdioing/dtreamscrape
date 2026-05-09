import { BlogPreviewPage } from '@/src/admin/pages/BlogPreviewPage';

type PageProps = { params: Promise<{ id: string }> };

export default async function PreviewBlogPostRoute({ params }: PageProps) {
  const { id } = await params;
  return <BlogPreviewPage postId={id} />;
}

