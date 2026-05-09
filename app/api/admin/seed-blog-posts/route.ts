import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/src/lib/cached-posts';

export async function POST() {
  try {
    const samplePosts = [
      {
        slug: 'wedding-color-trends-2026',
        title: 'Wedding Color Trends for 2026',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'As we look ahead to 2026, wedding color palettes are evolving toward more sophisticated and personalized combinations. Couples are moving away from traditional expectations and embracing hues that truly reflect their personalities.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: 'Earthy Elegance' },
            { id: 'b_3', type: 'text', content: 'Warm terracottas, sage greens, and soft creams continue to dominate. These earthy tones create a sense of organic luxury and timeless beauty.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: 'Bold Statements' },
            { id: 'b_5', type: 'text', content: 'Deep jewel tones like emerald, sapphire, and amethyst are making a comeback for couples who want drama and sophistication.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: 'Monochromatic Magic' },
            { id: 'b_7', type: 'text', content: 'Single-color palettes in various shades create stunning visual impact and modern minimalism.' }
          ]
        }),
        excerpt: 'Discover the top wedding color trends for 2026, from earthy elegance to bold jewel tones.',
        featured_image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Design', 'Trends'],
        tags: ['wedding-colors', '2026-trends', 'color-palettes'],
        meta_title: 'Wedding Color Trends 2026 | Dreamscape Blog',
        meta_description: 'Explore the top wedding color trends for 2026 and find inspiration for your special day.',
        status: 'published',
        published_at: new Date().toISOString()
      },
      {
        slug: 'destination-wedding-guide',
        title: 'The Ultimate Guide to Destination Weddings',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'A destination wedding turns your celebration into an unforgettable adventure for you and your guests. But pulling off a wedding in a dream location requires careful planning and consideration.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: 'Choosing Your Location' },
            { id: 'b_3', type: 'text', content: 'Consider the climate, accessibility for guests, local marriage requirements, and the overall vibe you want to achieve.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: 'Timing is Everything' },
            { id: 'b_5', type: 'text', content: 'Send save-the-dates at least 6-8 months in advance. Many guests will need time to plan travel and take time off work.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: 'Work with Local Experts' },
            { id: 'b_7', type: 'text', content: 'Local planners and vendors know the terrain, regulations, and hidden gems that can make your wedding extraordinary.' }
          ]
        }),
        excerpt: 'Everything you need to know about planning the perfect destination wedding, from location scouting to guest logistics.',
        featured_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Planning', 'Destination'],
        tags: ['destination-wedding', 'wedding-planning', 'travel'],
        meta_title: 'Destination Wedding Guide | Dreamscape Blog',
        meta_description: 'Complete guide to planning a destination wedding, from choosing locations to managing guest travel.',
        status: 'published',
        published_at: new Date().toISOString()
      },
      {
        slug: 'sustainable-wedding-ideas',
        title: 'Eco-Friendly Wedding Ideas for Conscious Couples',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'More couples are choosing to celebrate their love while honoring the planet. Sustainable weddings reduce environmental impact without sacrificing beauty or elegance.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: 'Venue Choices' },
            { id: 'b_3', type: 'text', content: 'Choose venues that prioritize sustainability, like botanical gardens, organic farms, or historic buildings with green practices.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: 'Floral & Decor' },
            { id: 'b_5', type: 'text', content: 'Use locally sourced, seasonal flowers. Rent or repurpose decor items. Choose potted plants that guests can take home.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: 'Catering & Favors' },
            { id: 'b_7', type: 'text', content: 'Opt for locally sourced, organic catering. Give guests sustainable favors like seeds, potted plants, or donations to environmental causes.' }
          ]
        }),
        excerpt: 'Beautiful eco-friendly wedding ideas that help you celebrate sustainably without compromising on style.',
        featured_image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Planning', 'Sustainable'],
        tags: ['eco-friendly', 'sustainable-wedding', 'green-wedding'],
        meta_title: 'Eco-Friendly Wedding Ideas | Dreamscape Blog',
        meta_description: 'Sustainable wedding ideas for environmentally conscious couples who want to celebrate responsibly.',
        status: 'published',
        published_at: new Date().toISOString()
      },
      {
        slug: 'corporate-event-planning-checklist',
        title: 'Corporate Event Planning Checklist',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'Successful corporate events require meticulous planning, attention to detail, and clear objectives. Whether you\'re planning a product launch, conference, or company retreat, this checklist will keep you on track.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: '3-6 Months Before' },
            { id: 'b_3', type: 'text', content: 'Define event goals and budget, book venue, hire key vendors, create timeline, and begin promotion.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: '2-3 Months Before' },
            { id: 'b_5', type: 'text', content: 'Confirm catering, finalize AV requirements, send invitations, arrange accommodations, and plan transportation.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: '1 Month Before' },
            { id: 'b_7', type: 'text', content: 'Confirm all vendors, finalize headcount, prepare name badges and materials, and create day-of timeline.' }
          ]
        }),
        excerpt: 'A comprehensive corporate event planning checklist to ensure your business event runs smoothly from start to finish.',
        featured_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Corporate'],
        tags: ['corporate-events', 'event-planning', 'checklist'],
        meta_title: 'Corporate Event Planning Checklist | Dreamscape Blog',
        meta_description: 'Complete checklist for planning successful corporate events, conferences, and business gatherings.',
        status: 'published',
        published_at: new Date().toISOString()
      },
      {
        slug: 'wedding-budget-tips',
        title: 'How to Create a Realistic Wedding Budget',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'Creating a wedding budget is one of the first and most important steps in wedding planning. A well-planned budget ensures you get what you want without breaking the bank.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: 'Start with Priorities' },
            { id: 'b_3', type: 'text', content: 'List your top 3 priorities. These are the areas where you should allocate more of your budget.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: 'Research Costs' },
            { id: 'b_5', type: 'text', content: 'Get quotes from multiple vendors. Understand what\'s included in each price to make accurate comparisons.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: 'Build in Buffer' },
            { id: 'b_7', type: 'text', content: 'Always set aside 10-15% of your total budget for unexpected expenses and last-minute additions.' }
          ]
        }),
        excerpt: 'Learn how to create a wedding budget that works for you and helps you prioritize what matters most.',
        featured_image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2070&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Planning'],
        tags: ['wedding-budget', 'budget-planning', 'money-tips'],
        meta_title: 'Wedding Budget Tips | Dreamscape Blog',
        meta_description: 'Expert tips for creating and managing your wedding budget effectively.',
        status: 'published',
        published_at: new Date().toISOString()
      },
      {
        slug: 'micro-wedding-guide',
        title: 'The Rise of Micro Weddings: Intimate Celebrations',
        content: JSON.stringify({
          subtitle: '',
          location: '',
          image: '',
          contentBlocks: [
            { id: 'b_1', type: 'text', content: 'Micro weddings typically have fewer than 50 guests and focus on creating deeply personal, meaningful experiences. This trend has accelerated recently, and couples are discovering the unique benefits of intimate celebrations.' },
            { id: 'b_2', type: 'heading', level: 'h2', content: 'Benefits of Micro Weddings' },
            { id: 'b_3', type: 'text', content: 'More budget per guest, flexibility with venue choices, more quality time with each guest, and reduced planning stress.' },
            { id: 'b_4', type: 'heading', level: 'h2', content: 'Planning Considerations' },
            { id: 'b_5', type: 'text', content: 'Be thoughtful about your guest list. Create meaningful experiences. Focus on details that matter to you as a couple.' },
            { id: 'b_6', type: 'heading', level: 'h2', content: 'Creative Ideas' },
            { id: 'b_7', type: 'text', content: 'Extended celebrations, personalized favors, intimate dining experiences, and unique venues that wouldn\'t work for larger crowds.' }
          ]
        }),
        excerpt: 'Why micro weddings are becoming increasingly popular and how to plan an intimate celebration that feels grand.',
        featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
        author: 'Dreamscape Team',
        categories: ['Planning', 'Trends'],
        tags: ['micro-wedding', 'intimate-wedding', 'small-wedding'],
        meta_title: 'Micro Wedding Guide | Dreamscape Blog',
        meta_description: 'Everything you need to know about planning a micro wedding or intimate celebration.',
        status: 'published',
        published_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabaseAdmin()
      .from('portfolio_items')
      // @ts-ignore - Supabase type inference issue with insert
      .insert(samplePosts)
      .select();

    if (error) {
      console.error('❌ Error seeding blog posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag(CACHE_TAGS.BLOG_LIST, "max");
    return NextResponse.json({
      success: true,
      message: 'Blog posts seeded successfully',
      count: data.length
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
