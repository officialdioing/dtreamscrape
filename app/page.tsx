import HomePage from '@/src/components/pages/HomePage';
import { getSiteContentPageCached } from '@/src/lib/backend-content';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  let grouped: Record<string, any> | undefined;
  try {
    const res = await getSiteContentPageCached('home');
    grouped = res.grouped;
  } catch {
    // HomePage will fall back client-side
  }

  return <HomePage initialGrouped={grouped} />;
}
