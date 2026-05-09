import { ContentEditPage } from '@/src/admin/pages/ContentEditPage';

export default async function NewContentRoute({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams?: Promise<{ section?: string }> | { section?: string };
}) {
  const { page } = await params;
  const resolvedSearchParams =
    searchParams && 'then' in searchParams ? await searchParams : searchParams;

  return (
    <ContentEditPage
      page={page}
      id="new"
      initialSection={resolvedSearchParams?.section}
    />
  );
}
