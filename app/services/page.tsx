import ServicesPage from '@/src/components/pages/ServicesPage';
import { getPublishedServicesCached } from '@/src/lib/backend-services';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  const items = await getPublishedServicesCached();
  return <ServicesPage initialServices={items ?? []} />;
}
