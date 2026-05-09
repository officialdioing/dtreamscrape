import FAQPage from '@/src/components/pages/FAQPage';
import { getSiteContentSectionCached } from '@/src/lib/backend-content';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialFAQs: any;
  try {
    const { grouped } = await getSiteContentSectionCached('faq', 'faqs');
    const faqData = grouped?.faq_faqs;
    const rawFAQs = faqData?.items?.value;

    if (typeof rawFAQs === 'string') {
      try {
        initialFAQs = JSON.parse(rawFAQs);
      } catch {
        initialFAQs = null;
      }
    } else if (Array.isArray(rawFAQs)) {
      initialFAQs = rawFAQs;
    }
  } catch {
    // FAQPage will fall back client-side
  }

  return <FAQPage initialFAQs={initialFAQs} />;
}
