import { notFound } from 'next/navigation';
import PortfolioStoryPage from '@/src/components/pages/PortfolioStoryPage';
import { mapPortfolioItemToPublicPost } from '@/src/lib/public-posts';
import { getPortfolioItemBySlugCached } from '@/src/lib/backend-portfolio';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const key = (slug || '').trim().replace(/\s+/g, '');

  try {
    const data = await getPortfolioItemBySlugCached(key);
    if (data) {
      return <PortfolioStoryPage slug={key} post={mapPortfolioItemToPublicPost(data)} />;
    }
  } catch {
    // fall through to fallback/notFound
  }

  notFound();
}
