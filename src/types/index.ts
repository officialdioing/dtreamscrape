/**
 * Central type definitions for Dreamscape Curated Event
 * This file contains all shared TypeScript interfaces and types
 */

// ============================================================================
// Database Row Types
// ============================================================================

export interface SiteContentRow {
  id: string;
  page: string;
  section: string;
  content_key: string;
  content_type: 'text' | 'json' | 'number' | 'boolean';
  content: string | null;
  content_json: Record<string, unknown> | null;
  content_number: number | null;
  content_boolean: boolean | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | Record<string, unknown> | null;
  featured_image: string | null;
  categories: string[] | { value: string[] } | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  slug: string;
  title: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  featured_image: string | null;
  description: string | null;
  meta_description: string | null;
  excerpt: string | null;
  images: string | Record<string, unknown>[] | null;
  gallery_images: string[] | null;
  is_published: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  venue: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  is_published: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured_image: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  event_date: string | null;
  event_location: string | null;
  event_types: string[] | null;
  budget: string | null;
  guests: string | null;
  how_did_you_hear: string | null;
  additional_details: string | null;
  consultation_date: string;
  consultation_time: string;
  file_urls: string[] | null;
  file_names: string[] | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Content Block Types
// ============================================================================

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'quote';
  content: string;
  level?: string;
  caption?: string;
}

export interface ContentValue {
  value: string | number | boolean | Record<string, unknown> | unknown[] | null;
}

export interface GroupedContent {
  [contentKey: string]: ContentValue;
}

export interface SiteContentData {
  [key: string]: unknown;
}

// ============================================================================
// Blog Post Types
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  img: string;
  desc: string;
  fullStory: string[];
  gallery: string[];
  contentBlocks?: ContentBlock[];
}

// ============================================================================
// Portfolio Types
// ============================================================================

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string;
  featured_image: string;
  description: string;
  meta_description: string;
  excerpt: string;
  images: string[];
  gallery_images: string[];
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  venue: string;
  featured_image: string;
  gallery_images: string[];
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  featured_image: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Booking Types
// ============================================================================

export interface Booking {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  event_date?: string;
  event_location?: string;
  event_types: string[];
  budget?: string;
  guests?: string;
  how_did_you_hear?: string;
  additional_details?: string;
  consultation_date: string;
  consultation_time: string;
  file_urls?: string[];
  file_names?: string[];
  created_at?: string;
}

// ============================================================================
// Google Calendar Types
// ============================================================================

export interface CalendarBooking {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  consultation_date: string;
  consultation_time: string;
  event_date?: string;
  event_location?: string;
  event_types?: string[];
  budget?: string;
  guests?: string;
  how_did_you_hear?: string;
  additional_details?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{ email: string }>;
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SiteContentResponse {
  grouped: Record<string, GroupedContent>;
}

// ============================================================================
// Form Types
// ============================================================================

export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate?: string;
  eventLocation?: string;
  eventTypes?: string[];
  budget?: string;
  guests?: string;
  howDidYouHear?: string;
  additionalDetails?: string;
  consultationDate: string;
  consultationTime: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseSiteContentReturn {
  content: SiteContentData;
  isLoading: boolean;
  error: string | null;
}

export interface UsePageContentReturn {
  content: Record<string, SiteContentData>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Page-Specific Types
// ============================================================================

export interface HeroText {
  headline: string;
  subheadline: string;
  description: string;
  bookingNote: string;
}

export interface BrandIntro {
  label: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  locationNote: string;
  image: string;
}

export interface StatItem {
  label: string;
  value: string | number;
}

export interface ServicesPreview {
  label: string;
  headline: string;
  ctaText: string;
  ctaLink: string;
  services: Service[];
}

export interface FeaturedEvents {
  label: string;
  headline: string;
  viewAllText: string;
  viewAllLink: string;
  description: string;
  events: Event[];
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface WhyDreamscape {
  headline: string;
  description: string;
  features: FeatureItem[];
}

export interface CtaSection {
  headline: string;
  description: string;
}

export interface LoveNote {
  name: string;
  quote: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Dict<T = unknown> = Record<string, T>;
