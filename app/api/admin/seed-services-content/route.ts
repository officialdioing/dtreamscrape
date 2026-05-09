import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

export async function POST() {
  try {
    // Delete existing Services page content
    const { error: deleteError } = await supabaseAdmin()
      .from('site_content')
      .delete()
      .eq('page', 'services');

    if (deleteError) {
      console.error('❌ Error deleting old services content:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new comprehensive Services page content
    const servicesContent = [
      // Page Intro
      { page: 'services', section: 'page_intro', content_key: 'headline', content_type: 'text', content: 'Curated Experiences for Every Occasion', display_order: 1 },
      { page: 'services', section: 'page_intro', content_key: 'description', content_type: 'richtext', content: 'Dreamscape delivers full-service planning, coordination, and production across weddings, private celebrations, corporate events, and large-scale experiences all executed with structure, creativity, and precision.', display_order: 2 },

      // Weddings
      { page: 'services', section: 'weddings', content_key: 'label', content_type: 'text', content: 'Weddings', display_order: 3 },
      { page: 'services', section: 'weddings', content_key: 'title', content_type: 'text', content: 'Luxury Wedding Planning & Production', display_order: 4 },
      { page: 'services', section: 'weddings', content_key: 'image', content_type: 'text', content: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop', display_order: 5 },
      { page: 'services', section: 'weddings', content_key: 'description', content_type: 'richtext', content: 'From intimate ceremonies to full wedding weekends, every detail is thoughtfully curated to reflect your vision with elegance and intention.', display_order: 6 },

      // Private Events
      { page: 'services', section: 'private_events', content_key: 'label', content_type: 'text', content: 'Private & Social Events', display_order: 7 },
      { page: 'services', section: 'private_events', content_key: 'title', content_type: 'text', content: 'Elevated Personal Celebrations', display_order: 8 },
      { page: 'services', section: 'private_events', content_key: 'image', content_type: 'text', content: 'https://images.unsplash.com/photo-1530103862676-de8892b07439?q=80&w=2070&auto=format&fit=crop', display_order: 9 },
      { page: 'services', section: 'private_events', content_key: 'description', content_type: 'richtext', content: 'From milestone birthdays to bridal showers and intimate dinners, we curate experiences that feel refined, seamless, and unforgettable.', display_order: 10 },

      // Corporate Events
      { page: 'services', section: 'corporate_events', content_key: 'label', content_type: 'text', content: 'Corporate, Brand & Industry Events', display_order: 11 },
      { page: 'services', section: 'corporate_events', content_key: 'title', content_type: 'text', content: 'Strategy Meets Sophistication', display_order: 12 },
      { page: 'services', section: 'corporate_events', content_key: 'image', content_type: 'text', content: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop', display_order: 13 },
      { page: 'services', section: 'corporate_events', content_key: 'description', content_type: 'richtext', content: 'We partner with brands, entrepreneurs, and organizations to create experiences that communicate vision, elevate presence, and engage audiences.', display_order: 14 },

      // Special Events
      { page: 'services', section: 'special_events', content_key: 'label', content_type: 'text', content: 'Special & Public Events', display_order: 15 },
      { page: 'services', section: 'special_events', content_key: 'title', content_type: 'text', content: 'Large-Scale, Seamlessly Executed', display_order: 16 },
      { page: 'services', section: 'special_events', content_key: 'image', content_type: 'text', content: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop', display_order: 17 },
      { page: 'services', section: 'special_events', content_key: 'description', content_type: 'richtext', content: 'From cultural celebrations to charity galas and public showcases, Dreamscape delivers structured planning and smooth execution at scale.', display_order: 18 },

      // Destination
      { page: 'services', section: 'destination', content_key: 'label', content_type: 'text', content: 'Destination & Luxury Experiences', display_order: 19 },
      { page: 'services', section: 'destination', content_key: 'title', content_type: 'text', content: 'Luxury Without Borders', display_order: 20 },
      { page: 'services', section: 'destination', content_key: 'image', content_type: 'text', content: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop', display_order: 21 },
      { page: 'services', section: 'destination', content_key: 'description', content_type: 'richtext', content: 'From yachts to villas to international celebrations, we curate destination experiences that are immersive, seamless, and unforgettable.', display_order: 22 },

      // Final CTA
      { page: 'services', section: 'final_cta', content_key: 'headline', content_type: 'text', content: "Not sure where to start? Let's create something unforgettable together.", display_order: 23 },
      { page: 'services', section: 'final_cta', content_key: 'button_text', content_type: 'text', content: 'Book a Consultation', display_order: 24 },
      { page: 'services', section: 'final_cta', content_key: 'button_link', content_type: 'text', content: '/consultation-editorial', display_order: 25 },
    ];

    const { error: insertError } = await supabaseAdmin()
      .from('site_content')
      // @ts-ignore - Supabase type inference issue with insert
      .insert(servicesContent);

    if (insertError) {
      console.error('❌ Error inserting services content:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert JSON arrays
    const jsonContent = [
      {
        page: 'services',
        section: 'weddings',
        content_key: 'planning_options',
        content_type: 'json',
        content_json: [
          "Month-of Coordination",
          "Partial Planning",
          "Full Planning & Design",
          "Dreamscape Exclusive",
          "Destination Weddings (including international experiences such as Dallas, USA)"
        ],
        display_order: 1
      },
      {
        page: 'services',
        section: 'private_events',
        content_key: 'includes_list',
        content_type: 'json',
        content_json: [
          "Concept & mood board",
          "Vendor sourcing & coordination",
          "Styling guidance",
          "Timeline & logistics",
          "Full day-of execution"
        ],
        display_order: 2
      },
      {
        page: 'services',
        section: 'corporate_events',
        content_key: 'services_list',
        content_type: 'json',
        content_json: [
          "Brand activations & launches",
          "Corporate events & retreats",
          "Expos, showcases & industry events"
        ],
        display_order: 3
      }
    ];

    const { error: jsonError } = await supabaseAdmin()
      .from('site_content')
      // @ts-ignore - Supabase type inference issue with insert
      .insert(jsonContent);

    if (jsonError) {
      console.error('❌ Error inserting JSON content:', jsonError);
      return NextResponse.json({ error: jsonError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Services page content seeded successfully',
      count: servicesContent.length + jsonContent.length
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
