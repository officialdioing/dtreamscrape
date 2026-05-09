import { notFound } from 'next/navigation'
import { getContentPageConfig } from '@/src/admin/content/content-dashboard'
import { ContentSectionsPage } from '@/src/admin/pages/ContentSectionsPage'

export default async function PageContentRoute({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params
  const config = getContentPageConfig(page)

  if (!config) {
    notFound()
  }

  const sections = config.sections.map(({ id, label, description }) => ({
    id,
    label,
    description,
  }))

  return (
    <ContentSectionsPage
      page={page}
      title={config.label}
      description={config.description}
      sections={sections}
    />
  )
}
