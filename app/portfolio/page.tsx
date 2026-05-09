import PortfolioPage from '@/src/components/pages/PortfolioPage';
import { getPortfolioItemsCached } from '@/src/lib/backend-portfolio';
import { mapPortfolioItemToPublicPost } from '@/src/lib/public-posts';
import type { BlogPost } from '@/src/lib/blog-posts';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialPosts: BlogPost[] | undefined;
  try {
    const rows = await getPortfolioItemsCached();
    const mapped = rows.map(mapPortfolioItemToPublicPost).filter((p: BlogPost) => p.id && p.title);
    initialPosts = mapped.length ? mapped : undefined;
  } catch {
    // PortfolioPage will fall back client-side
  }
  return <PortfolioPage initialPosts={initialPosts} />;
}
