import LoveNotesPage from '@/src/components/pages/LoveNotesPage';
import { getSiteContentSectionCached } from '@/src/lib/backend-content';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialTestimonials:
    | Array<{ name: string; quote: string; img: string }>
    | undefined;

  try {
    const { grouped } = await getSiteContentSectionCached('love_notes', 'testimonials');
    const data = grouped?.love_notes_testimonials || {};
    const items = data.items?.value || [];
    if (Array.isArray(items) && items.length) {
      initialTestimonials = items;
    }
  } catch {
    // LoveNotesPage will fall back client-side
  }

  return <LoveNotesPage initialTestimonials={initialTestimonials} />;
}
