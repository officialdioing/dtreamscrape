import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface ContentItem {
  page: string;
  section: string;
  content_key: string;
  content_type: 'text' | 'json' | 'number';
  content?: string;
  content_json?: any;
  content_number?: number;
  display_order: number;
  is_active: boolean;
}

async function migrateContent() {
  console.log('🔄 Starting content migration to database...\n');

  const contentItems: ContentItem[] = [
    // === HOMEPAGE CONTENT ===
    {
      page: 'home',
      section: 'hero',
      content_key: 'headline',
      content_type: 'text',
      content: 'More Than Events.',
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'hero',
      content_key: 'subheadline',
      content_type: 'text',
      content: 'We Curate Experiences.',
      display_order: 2,
      is_active: true
    },
    {
      page: 'home',
      section: 'hero',
      content_key: 'description',
      content_type: 'text',
      content: 'Luxury weddings, private celebrations, and elevated brand experiences thoughtfully designed, seamlessly coordinated, and beautifully executed.',
      display_order: 3,
      is_active: true
    },
    {
      page: 'home',
      section: 'hero',
      content_key: 'bookingNote',
      content_type: 'text',
      content: 'Now booking 2026 & 2027 events',
      display_order: 4,
      is_active: true
    },

    // Homepage Brand Intro
    {
      page: 'home',
      section: 'brand_intro',
      content_key: 'label',
      content_type: 'text',
      content: 'Welcome to Dreamscape',
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'brand_intro',
      content_key: 'headline',
      content_type: 'text',
      content: 'Intentional design meets structured coordination.',
      display_order: 2,
      is_active: true
    },
    {
      page: 'home',
      section: 'brand_intro',
      content_key: 'paragraph1',
      content_type: 'text',
      content: 'Dreamscape Curated Events is a Toronto-based planning and production company specializing in weddings, milestone celebrations, corporate events, and bespoke experiences.',
      display_order: 3,
      is_active: true
    },
    {
      page: 'home',
      section: 'brand_intro',
      content_key: 'paragraph2',
      content_type: 'text',
      content: 'We blend intentional design with structured coordination systems to deliver seamless, elevated events from concept to execution.',
      display_order: 4,
      is_active: true
    },
    {
      page: 'home',
      section: 'brand_intro',
      content_key: 'locationNote',
      content_type: 'text',
      content: 'Toronto-based | Available Worldwide',
      display_order: 5,
      is_active: true
    },

    // Homepage Services Preview
    {
      page: 'home',
      section: 'services_preview',
      content_key: 'label',
      content_type: 'text',
      content: 'Our Expertise',
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'services_preview',
      content_key: 'headline',
      content_type: 'text',
      content: 'Curated Experiences',
      display_order: 2,
      is_active: true
    },
    {
      page: 'home',
      section: 'services_preview',
      content_key: 'ctaText',
      content_type: 'text',
      content: 'Explore Services',
      display_order: 3,
      is_active: true
    },
    {
      page: 'home',
      section: 'services_preview',
      content_key: 'ctaLink',
      content_type: 'text',
      content: '/services',
      display_order: 4,
      is_active: true
    },

    // Homepage Featured Events
    {
      page: 'home',
      section: 'featured_events',
      content_key: 'label',
      content_type: 'text',
      content: 'Blog',
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'featured_events',
      content_key: 'headline',
      content_type: 'text',
      content: 'Featured Events',
      display_order: 2,
      is_active: true
    },
    {
      page: 'home',
      section: 'featured_events',
      content_key: 'viewAllText',
      content_type: 'text',
      content: 'View Experience',
      display_order: 3,
      is_active: true
    },
    {
      page: 'home',
      section: 'featured_events',
      content_key: 'viewAllLink',
      content_type: 'text',
      content: '/portfolio',
      display_order: 4,
      is_active: true
    },
    {
      page: 'home',
      section: 'featured_events',
      content_key: 'description',
      content_type: 'text',
      content: 'A refined destination wedding experience blending culture, elegance, and intentional design. From planning to execution, every detail was curated to deliver a seamless and unforgettable celebration.',
      display_order: 5,
      is_active: true
    },

    // Homepage Why Dreamscape
    {
      page: 'home',
      section: 'why_dreamscape',
      content_key: 'headline',
      content_type: 'text',
      content: 'Why Dreamscape',
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'why_dreamscape',
      content_key: 'features',
      content_type: 'json',
      content_json: [
        'Intentional design from concept to execution',
        'Structured planning systems that eliminate stress',
        'Trusted and curated vendor network',
        'Seamless guest experience from start to finish'
      ],
      display_order: 2,
      is_active: true
    },

    // Homepage CTA
    {
      page: 'home',
      section: 'cta',
      content_key: 'headline',
      content_type: 'text',
      content: 'Ready to bring your vision to life?',
      display_order: 1,
      is_active: true
    },

    // === CONTACT PAGE CONTENT ===
    {
      page: 'contact',
      section: 'contact_info',
      content_key: 'cards',
      content_type: 'json',
      content_json: [
        {
          label: 'Email',
          value: 'dreamscapeventts@gmail.com',
          href: 'mailto:dreamscapeventts@gmail.com'
        },
        {
          label: 'Phone',
          value: '+1 (365) 987-9393',
          href: 'tel:+13659879393'
        },
        {
          label: 'WhatsApp',
          value: '+1 (365) 987-9393',
          href: 'https://wa.me/13659879393'
        },
        {
          label: 'Instagram',
          value: '@dreamscapeventts',
          href: 'https://instagram.com/dreamscapeventts'
        }
      ],
      display_order: 1,
      is_active: true
    },

    // === FOOTER CONTENT ===
    {
      page: 'home',
      section: 'footer',
      content_key: 'exploreLinks',
      content_type: 'json',
      content_json: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Blog', href: '/portfolio' },
        { label: 'FAQ', href: '/faq' }
      ],
      display_order: 1,
      is_active: true
    },
    {
      page: 'home',
      section: 'footer',
      content_key: 'companyLinks',
      content_type: 'json',
      content_json: [
        { label: 'About', href: '/about' },
        { label: 'Love Notes', href: '/love-notes' },
        { label: 'Contact', href: '/contact' }
      ],
      display_order: 2,
      is_active: true
    },
    {
      page: 'home',
      section: 'footer',
      content_key: 'connectLinks',
      content_type: 'json',
      content_json: [
        { label: 'Instagram', href: 'https://instagram.com/dreamscapeventts' },
        { label: 'Email', href: 'mailto:dreamscapeventts@gmail.com' },
        { label: 'WhatsApp', href: 'https://wa.me/13659879393' },
        { label: 'Consultation', href: '/consultation-editorial' }
      ],
      display_order: 3,
      is_active: true
    },
    {
      page: 'home',
      section: 'footer',
      content_key: 'copyright',
      content_type: 'text',
      content: `© ${new Date().getFullYear()} Dreamscape Curated Events Inc. All rights reserved.`,
      display_order: 4,
      is_active: true
    },

    // === FAQ PAGE CONTENT ===
    {
      page: 'faq',
      section: 'faqs',
      content_key: 'items',
      content_type: 'json',
      content_json: [
        {
          question: 'Do you offer partial planning?',
          answer: 'Yes — we offer multiple planning tiers for weddings depending on your needs.'
        },
        {
          question: 'Do you travel?',
          answer: 'Yes, we plan destination weddings and events worldwide.'
        },
        {
          question: 'How do I get started?',
          answer: 'Book a consultation through our website.'
        }
      ],
      display_order: 1,
      is_active: true
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const item of contentItems) {
    try {
      // Check if content already exists
      const { data: existing } = await supabaseAdmin
        .from('site_content')
        .select('id')
        .eq('page', item.page)
        .eq('section', item.section)
        .eq('content_key', item.content_key)
        .single();

      if (existing) {
        // Update existing content
        const { error } = await supabaseAdmin
          .from('site_content')
          .update({
            content_type: item.content_type,
            content: item.content,
            content_json: item.content_json,
            content_number: item.content_number,
            display_order: item.display_order,
            is_active: item.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        console.log(`✅ Updated: ${item.page}/${item.section}/${item.content_key}`);
      } else {
        // Insert new content
        const { error } = await supabaseAdmin
          .from('site_content')
          .insert(item);

        if (error) throw error;
        console.log(`✅ Created: ${item.page}/${item.section}/${item.content_key}`);
      }

      successCount++;
    } catch (error: any) {
      console.error(`❌ Error with ${item.page}/${item.section}/${item.content_key}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${contentItems.length}`);
  console.log(`${'='.repeat(50)}\n`);

  if (errorCount === 0) {
    console.log('🎉 All content migrated successfully!');
    console.log('💡 Tip: Visit /admin to manage your content');
  } else {
    console.log('⚠️  Some items failed to migrate. Please check the errors above.');
  }
}

// Run migration
migrateContent().catch(console.error);
