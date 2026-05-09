import {
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  Heart,
  Home,
  Image,
  LayoutGrid,
  Mail,
  PenLine,
  Settings,
  Sparkles,
  type LucideIcon,
  User,
  Users,
} from 'lucide-react'

export type ContentSectionConfig = {
  id: string
  label: string
  description: string
  icon: LucideIcon
}

export type ContentPageConfig = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  tone: string
  sections: ContentSectionConfig[]
}

export const CONTENT_PAGES: ContentPageConfig[] = [
  {
    id: 'home',
    label: 'Home Page',
    description: 'Hero slides, brand intro, statistics, services preview',
    icon: Home,
    tone: 'violet',
    sections: [
      { id: 'hero', label: 'Hero Slides', description: 'Headline, subheadline, slides, and booking note.', icon: Sparkles },
      { id: 'brand_intro', label: 'Brand Intro', description: 'Story, positioning, and location note.', icon: PenLine },
      { id: 'statistics', label: 'Statistics', description: 'Homepage proof points and social proof.', icon: BarChart3 },
      { id: 'services_preview', label: 'Services Preview', description: 'Intro copy and CTA that introduce your services.', icon: Briefcase },
      { id: 'featured_events', label: 'Featured Events', description: 'Featured modules and supporting showcase content.', icon: Image },
      { id: 'why_dreamscape', label: 'Why Dreamscape', description: 'Value propositions and feature list.', icon: LayoutGrid },
      { id: 'cta', label: 'Call To Action', description: 'Final homepage conversion block.', icon: Sparkles },
      { id: 'footer', label: 'Footer', description: 'Footer navigation, social links, and copyright.', icon: FileText },
    ],
  },
  {
    id: 'about',
    label: 'About Page',
    description: 'Story, philosophy, team information',
    icon: User,
    tone: 'sky',
    sections: [
      { id: 'founder', label: 'Founder', description: 'Founder bio, portrait, and quote.', icon: User },
      { id: 'story', label: 'Story', description: 'The brand story and origin narrative.', icon: FileText },
      { id: 'philosophy', label: 'Philosophy', description: 'Values, approach, and point of view.', icon: Sparkles },
      { id: 'team', label: 'Team Information', description: 'Team overview and supporting details.', icon: Users },
    ],
  },
  {
    id: 'services',
    label: 'Services Page',
    description: 'Services page content and introduction',
    icon: Briefcase,
    tone: 'emerald',
    sections: [
      { id: 'page_intro', label: 'Page Intro', description: 'Intro headline and overview paragraph.', icon: FileText },
      { id: 'weddings', label: 'Weddings', description: 'Wedding planning and production content.', icon: Heart },
      { id: 'private_events', label: 'Private Events', description: 'Private and social celebration content.', icon: Sparkles },
      { id: 'corporate_events', label: 'Corporate Events', description: 'Brand and professional event content.', icon: Briefcase },
      { id: 'special_events', label: 'Special Events', description: 'Large-scale public and special events.', icon: Calendar },
      { id: 'destination', label: 'Destination', description: 'Destination and luxury experience content.', icon: Image },
      { id: 'final_cta', label: 'Final CTA', description: 'Closing call to action and booking link.', icon: Sparkles },
    ],
  },
  {
    id: 'contact',
    label: 'Contact Page',
    description: 'Contact information and forms',
    icon: Mail,
    tone: 'amber',
    sections: [
      { id: 'contact_info', label: 'Contact Information', description: 'Email, phone, WhatsApp, and social links.', icon: Mail },
      { id: 'forms', label: 'Forms', description: 'Inquiry form content and submission details.', icon: FileText },
    ],
  },
  {
    id: 'love_notes',
    label: 'Love Notes Page',
    description: 'Client testimonials and reviews',
    icon: Heart,
    tone: 'rose',
    sections: [
      { id: 'testimonials', label: 'Testimonials', description: 'Client notes, reviews, and story highlights.', icon: Heart },
    ],
  },
  {
    id: 'consultation',
    label: 'Consultation Page',
    description: 'Consultation booking configuration',
    icon: Calendar,
    tone: 'teal',
    sections: [
      { id: 'event_types', label: 'Event Types', description: 'Available service categories and booking choices.', icon: Calendar },
      { id: 'consultation_types', label: 'Consultation Types', description: 'Consultation type copy and editorial descriptions.', icon: FileText },
    ],
  },
  {
    id: 'consultation_editorial',
    label: 'Consultation Editorial Page',
    description: 'Consultation options and editorial content',
    icon: FileText,
    tone: 'cyan',
    sections: [
      { id: 'overview', label: 'Overview', description: 'Editorial intro for the consultation flow.', icon: Sparkles },
      { id: 'options', label: 'Options', description: 'Consultation options presented on the page.', icon: Calendar },
      { id: 'details', label: 'Editorial Details', description: 'Supporting editorial copy and framing.', icon: FileText },
      { id: 'cta', label: 'CTA', description: 'Booking call to action and next-step link.', icon: Sparkles },
    ],
  },
]

export const ADVANCED_CONTENT_PAGE: ContentPageConfig = {
  id: 'advanced',
  label: 'Advanced View',
  description: 'Table-based editing for all content items. For advanced users.',
  icon: Settings,
  tone: 'slate',
  sections: [],
}

export function getContentPageConfig(page: string) {
  return CONTENT_PAGES.find((item) => item.id === page)
}
