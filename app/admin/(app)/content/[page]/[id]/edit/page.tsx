import { getContentPageConfig } from '@/src/admin/content/content-dashboard';
import { ContentEditPage } from '@/src/admin/pages/ContentEditPage';
import { ContentSectionEditPage } from '@/src/admin/pages/ContentSectionEditPage';

export default async function EditContentRoute({ params }: { params: Promise<{ page: string; id: string }> }) {
  const { page, id } = await params;
  const config = getContentPageConfig(page);
  const isSection = Boolean(config?.sections.some((section) => section.id === id));

  if (isSection) {
    return <ContentSectionEditPage page={page} section={id} />;
  }

  return <ContentEditPage page={page} id={id} />;
}
