'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ScrollReveal } from '../ScrollReveal';
import { useAutoRefresh } from '@/src/lib/hooks/useAutoRefresh';

type Slide = {
  id: string;
  image: string;
};

type Stat = {
  id: string;
  value: string;
  label: string;
};

type Service = {
  id: string;
  title: string;
  description: string;
};

type FeaturedEvent = {
  id: string;
  title: string;
  location: string;
  image: string;
};

type HeroText = {
  headline: string;
  subheadline: string;
  description: string;
  bookingNote: string;
};

type BrandIntro = {
  label: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  locationNote: string;
  image: string;
};

type ServicesPreview = {
  label: string;
  headline: string;
  ctaText: string;
  ctaLink: string;
};

type FeaturedEvents = {
  label: string;
  headline: string;
  viewAllText: string;
  viewAllLink: string;
  description: string;
};

type WhyDreamscape = {
  label: string;
  headline: string;
  features: string[];
};

type CtaSection = {
  headline: string;
  subheadline: string;
  description: string;
  details: string;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'slide_1',
    image:
      'https://images.unsplash.com/photo-1769812343775-85a27e6a076c?auto=format&fit=crop&fm=jpg&q=80&w=2200'
  },
  {
    id: 'slide_2',
    image:
      'https://images.unsplash.com/photo-1773005695300-14b62bc85ba0?auto=format&fit=crop&fm=jpg&q=80&w=2200'
  },
  {
    id: 'slide_3',
    image:
      'https://images.unsplash.com/photo-1744389481598-9779b474f557?auto=format&fit=crop&fm=jpg&q=80&w=2200'
  }
];

const DEFAULT_HERO_TEXT: HeroText = {
  headline: 'More Than Events.',
  subheadline: 'We Curate Experiences.',
  description:
    'Luxury weddings, private celebrations, and elevated brand experiences thoughtfully designed, seamlessly coordinated, and beautifully executed.',
  bookingNote: 'Now booking 2026 & 2027 events'
};

const DEFAULT_BRAND_INTRO: BrandIntro = {
  label: 'Welcome to Dreamscape',
  headline: 'Intentional design meets structured coordination.',
  paragraph1:
    'Dreamscape Curated Events is a Toronto-based planning and production company specializing in weddings, milestone celebrations, corporate events, and bespoke experiences.',
  paragraph2:
    'We blend intentional design with structured coordination systems to deliver seamless, elevated events from concept to execution.',
  locationNote: 'Toronto-based | Available Worldwide',
  image:
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1974&auto=format&fit=crop'
};

const DEFAULT_STATS: Stat[] = [
  { id: 'stat_1', value: '30+', label: 'Events Completed' },
  { id: 'stat_2', value: '30+', label: 'Clients Served' },
  { id: 'stat_3', value: '10+', label: 'Years Experience' },
  { id: 'stat_4', value: '20+', label: 'Vendor Partners' }
];

const DEFAULT_SERVICES_PREVIEW: ServicesPreview = {
  label: 'Our Expertise',
  headline: 'Curated Experiences',
  ctaText: 'Explore Services',
  ctaLink: '/services'
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'service_1',
    title: 'Weddings',
    description: 'Curated planning for timeless, detail-driven wedding experiences.'
  },
  {
    id: 'service_2',
    title: 'Private & Social Events',
    description: 'Milestones and intimate celebrations designed with intention and elegance.'
  },
  {
    id: 'service_3',
    title: 'Corporate & Brand Events',
    description: 'Strategic, polished experiences that elevate your brand presence.'
  },
  {
    id: 'service_4',
    title: 'Destination Experiences',
    description: 'From international weddings to luxury travel-based celebrations.'
  }
];

const DEFAULT_FEATURED_EVENTS: FeaturedEvents = {
  label: 'Blog',
  headline: 'Featured Events',
  viewAllText: 'View Experience',
  viewAllLink: '/portfolio',
  description:
    'A refined destination wedding experience blending culture, elegance, and intentional design. From planning to execution, every detail was curated to deliver a seamless and unforgettable celebration.'
};

const DEFAULT_EVENTS: FeaturedEvent[] = [
  {
    id: 'event_1',
    title: "Nneoma's 25th Birthday",
    location: 'Toronto',
    image:
      'https://images.unsplash.com/photo-1530103862676-de8892b07439?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'event_2',
    title: "Dr. Chika's Graduation Celebration",
    location: 'Toronto',
    image:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop'
  },
  {
    id: 'event_3',
    title: "Troy's 1st Birthday",
    location: 'Toronto',
    image:
      'https://images.unsplash.com/photo-1513278974582-3e1b4a4fa21e?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'event_4',
    title: "Pearl & Donald's Wedding",
    location: 'Dallas',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'
  }
];

const DEFAULT_WHY: WhyDreamscape = {
  label: '',
  headline: 'Why Dreamscape',
  features: [
    'Intentional design from concept to execution',
    'Structured planning systems that eliminate stress',
    'Trusted and curated vendor network',
    'Seamless guest experience from start to finish'
  ]
};

const DEFAULT_CTA: CtaSection = {
  headline: 'Ready to bring your vision to life?',
  subheadline: '',
  description: '',
  details: ''
};

function deriveHomeState(grouped?: Record<string, any>) {
  if (!grouped) {
    return {
      slides: DEFAULT_SLIDES,
      heroText: DEFAULT_HERO_TEXT,
      brandIntro: DEFAULT_BRAND_INTRO,
      statistics: DEFAULT_STATS,
      servicesPreview: DEFAULT_SERVICES_PREVIEW,
      services: DEFAULT_SERVICES,
      featuredEvents: DEFAULT_FEATURED_EVENTS,
      events: DEFAULT_EVENTS,
      whyDreamscape: DEFAULT_WHY,
      ctaSection: DEFAULT_CTA,
    };
  }

  const data = grouped;

  const heroGroup = data.home_hero;
  const heroText: HeroText = heroGroup
    ? {
        headline: heroGroup.headline?.value || DEFAULT_HERO_TEXT.headline,
        subheadline: heroGroup.subheadline?.value || DEFAULT_HERO_TEXT.subheadline,
        description: heroGroup.description?.value || DEFAULT_HERO_TEXT.description,
        bookingNote: heroGroup.bookingNote?.value || DEFAULT_HERO_TEXT.bookingNote,
      }
    : DEFAULT_HERO_TEXT;

  let rawSlides = heroGroup?.slides?.value;
  if (typeof rawSlides === 'string') {
    try {
      rawSlides = JSON.parse(rawSlides);
    } catch {
      rawSlides = [];
    }
  }
  if (rawSlides && typeof rawSlides === 'object' && !Array.isArray(rawSlides)) {
    const maybeSlides = (rawSlides as any).slides;
    if (Array.isArray(maybeSlides)) rawSlides = maybeSlides;
  }
  const slideArray = Array.isArray(rawSlides) ? rawSlides : [];
  const slides: Slide[] = slideArray
    .map((slide: any, index: number) => ({
      id: slide?.id || `slide_${index + 1}`,
      image:
        typeof slide === 'string'
          ? slide
          : typeof slide?.image === 'string'
            ? slide.image
            : '',
    }))
    .filter((slide: Slide) => slide.image.trim().length > 0);

  const brandGroup = data.home_brandIntro;
  const brandIntro: BrandIntro = brandGroup
    ? {
        label: brandGroup.label?.value || DEFAULT_BRAND_INTRO.label,
        headline: brandGroup.headline?.value || DEFAULT_BRAND_INTRO.headline,
        paragraph1: brandGroup.paragraph1?.value || DEFAULT_BRAND_INTRO.paragraph1,
        paragraph2: brandGroup.paragraph2?.value || DEFAULT_BRAND_INTRO.paragraph2,
        locationNote: brandGroup.locationNote?.value || DEFAULT_BRAND_INTRO.locationNote,
        image: brandGroup.image?.value || DEFAULT_BRAND_INTRO.image,
      }
    : DEFAULT_BRAND_INTRO;

  let rawStats = data.home_statistics?.stats?.value;
  if (typeof rawStats === 'string') {
    try {
      rawStats = JSON.parse(rawStats);
    } catch {
      rawStats = [];
    }
  }
  const statsArray = Array.isArray(rawStats) ? rawStats : [];
  const statistics: Stat[] = statsArray
    .map((stat: any, index: number) => ({
      id: stat?.id || `stat_${index + 1}`,
      value: typeof stat?.value === 'string' ? stat.value : '',
      label: typeof stat?.label === 'string' ? stat.label : '',
    }))
    .filter((stat: Stat) => stat.value.trim() && stat.label.trim());

  const servicesGroup = data.home_servicesPreview;
  const servicesPreview: ServicesPreview = servicesGroup
    ? {
        label: servicesGroup.label?.value || DEFAULT_SERVICES_PREVIEW.label,
        headline: servicesGroup.headline?.value || DEFAULT_SERVICES_PREVIEW.headline,
        ctaText: servicesGroup.ctaText?.value || DEFAULT_SERVICES_PREVIEW.ctaText,
        ctaLink: servicesGroup.ctaLink?.value || DEFAULT_SERVICES_PREVIEW.ctaLink,
      }
    : DEFAULT_SERVICES_PREVIEW;

  let rawServices = servicesGroup?.services?.value;
  if (typeof rawServices === 'string') {
    try {
      rawServices = JSON.parse(rawServices);
    } catch {
      rawServices = [];
    }
  }
  const servicesArray = Array.isArray(rawServices) ? rawServices : [];
  const services: Service[] = servicesArray
    .map((service: any, index: number) => ({
      id: service?.id || `service_${index + 1}`,
      title: typeof service?.title === 'string' ? service.title : '',
      description: typeof service?.description === 'string' ? service.description : '',
    }))
    .filter((service: Service) => service.title.trim() && service.description.trim());

  const featuredGroup = data.home_featuredEvents;
  const featuredEvents: FeaturedEvents = featuredGroup
    ? {
        label: featuredGroup.label?.value || DEFAULT_FEATURED_EVENTS.label,
        headline: featuredGroup.headline?.value || DEFAULT_FEATURED_EVENTS.headline,
        viewAllText: featuredGroup.viewAllText?.value || DEFAULT_FEATURED_EVENTS.viewAllText,
        viewAllLink: featuredGroup.viewAllLink?.value || DEFAULT_FEATURED_EVENTS.viewAllLink,
        description: featuredGroup.description?.value || DEFAULT_FEATURED_EVENTS.description,
      }
    : DEFAULT_FEATURED_EVENTS;

  let rawEvents = featuredGroup?.events?.value;
  if (typeof rawEvents === 'string') {
    try {
      rawEvents = JSON.parse(rawEvents);
    } catch {
      rawEvents = [];
    }
  }
  const eventsArray = Array.isArray(rawEvents) ? rawEvents : [];
  const events: FeaturedEvent[] = eventsArray
    .map((event: any, index: number) => ({
      id: event?.id || `event_${index + 1}`,
      title: typeof event?.title === 'string' ? event.title : '',
      location: typeof event?.location === 'string' ? event.location : '',
      image: typeof event?.image === 'string' ? event.image : '',
    }))
    .filter((event: FeaturedEvent) => event.title.trim() && event.location.trim() && event.image.trim());

  const whyGroup = data.home_whyDreamscape;
  let rawFeatures = whyGroup?.features?.value;
  if (typeof rawFeatures === 'string') {
    try {
      rawFeatures = JSON.parse(rawFeatures);
    } catch {
      rawFeatures = [];
    }
  }
  const featuresArray = Array.isArray(rawFeatures) ? rawFeatures : [];
  const nextFeatures = featuresArray
    .map((feature: any) => (typeof feature === 'string' ? feature : ''))
    .map((feature: string) => feature.trim())
    .filter(Boolean);

  const whyDreamscape: WhyDreamscape = whyGroup
    ? {
        label: whyGroup.label?.value || DEFAULT_WHY.label,
        headline: whyGroup.headline?.value || DEFAULT_WHY.headline,
        features: nextFeatures.length ? nextFeatures : DEFAULT_WHY.features,
      }
    : DEFAULT_WHY;

  const ctaGroup = data.home_cta;
  const ctaSection: CtaSection = ctaGroup
    ? {
        headline: ctaGroup.headline?.value || DEFAULT_CTA.headline,
        subheadline: ctaGroup.subheadline?.value || DEFAULT_CTA.subheadline,
        description: ctaGroup.description?.value || DEFAULT_CTA.description,
        details: ctaGroup.details?.value || DEFAULT_CTA.details,
      }
    : DEFAULT_CTA;

  return {
    slides: slides.length ? slides : DEFAULT_SLIDES,
    heroText,
    brandIntro,
    statistics: statistics.length ? statistics : DEFAULT_STATS,
    servicesPreview,
    services: services.length ? services : DEFAULT_SERVICES,
    featuredEvents,
    events: events.length ? events : DEFAULT_EVENTS,
    whyDreamscape,
    ctaSection,
  };
}

export default function HomePage({ initialGrouped }: { initialGrouped?: Record<string, any> }) {
  // Custom simple crossfade hero carousel
  const derived = useMemo(() => deriveHomeState(initialGrouped), [initialGrouped]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(derived.slides);
  const [heroText, setHeroText] = useState<HeroText>(derived.heroText);
  const [brandIntro, setBrandIntro] = useState<BrandIntro>(derived.brandIntro);
  const [statistics, setStatistics] = useState<Stat[]>(derived.statistics);
  const [servicesPreview, setServicesPreview] = useState<ServicesPreview>(derived.servicesPreview);
  const [services, setServices] = useState<Service[]>(derived.services);
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvents>(derived.featuredEvents);
  const [events, setEvents] = useState<FeaturedEvent[]>(derived.events);
  const [whyDreamscape, setWhyDreamscape] = useState<WhyDreamscape>(derived.whyDreamscape);
  const [ctaSection, setCtaSection] = useState<CtaSection>(derived.ctaSection);

  // Fetch content function with auto-refresh capability
  const fetchContent = useCallback(async () => {
    if (initialGrouped) return;
    try {
      const res = await fetch('/api/site-content?page=home&_t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.grouped || {};

      if (data.home_hero) {
        const nextHero: HeroText = {
          headline: data.home_hero.headline?.value || DEFAULT_HERO_TEXT.headline,
          subheadline: data.home_hero.subheadline?.value || DEFAULT_HERO_TEXT.subheadline,
          description: data.home_hero.description?.value || DEFAULT_HERO_TEXT.description,
          bookingNote: data.home_hero.bookingNote?.value || DEFAULT_HERO_TEXT.bookingNote
        };
        setHeroText(nextHero);

        let rawSlides = data.home_hero.slides?.value;
        if (typeof rawSlides === 'string') {
          try {
            rawSlides = JSON.parse(rawSlides);
          } catch {
            rawSlides = [];
          }
        }
        if (rawSlides && typeof rawSlides === 'object' && !Array.isArray(rawSlides)) {
          const maybeSlides = (rawSlides as any).slides;
          if (Array.isArray(maybeSlides)) rawSlides = maybeSlides;
        }

        const slideArray = Array.isArray(rawSlides) ? rawSlides : [];
        const nextSlides: Slide[] = slideArray
          .map((slide: any, index: number) => ({
            id: slide?.id || `slide_${index + 1}`,
            image:
              typeof slide === 'string'
                ? slide
                : typeof slide?.image === 'string'
                  ? slide.image
                  : ''
          }))
          .filter((slide: Slide) => slide.image.trim().length > 0);

        if (nextSlides.length) {
          setSlides(nextSlides);
        }
      }

      if (data.home_brandIntro) {
        setBrandIntro({
          label: data.home_brandIntro.label?.value || DEFAULT_BRAND_INTRO.label,
          headline: data.home_brandIntro.headline?.value || DEFAULT_BRAND_INTRO.headline,
          paragraph1: data.home_brandIntro.paragraph1?.value || DEFAULT_BRAND_INTRO.paragraph1,
          paragraph2: data.home_brandIntro.paragraph2?.value || DEFAULT_BRAND_INTRO.paragraph2,
          locationNote: data.home_brandIntro.locationNote?.value || DEFAULT_BRAND_INTRO.locationNote,
          image: data.home_brandIntro.image?.value || DEFAULT_BRAND_INTRO.image
        });
      }

      if (data.home_statistics?.stats?.value) {
        let rawStats = data.home_statistics.stats.value;
        if (typeof rawStats === 'string') {
          try {
            rawStats = JSON.parse(rawStats);
          } catch {
            rawStats = [];
          }
        }

        const statsArray = Array.isArray(rawStats) ? rawStats : [];
        const nextStats: Stat[] = statsArray
          .map((stat: any, index: number) => ({
            id: stat?.id || `stat_${index + 1}`,
            value: typeof stat?.value === 'string' ? stat.value : '',
            label: typeof stat?.label === 'string' ? stat.label : ''
          }))
          .filter((stat: Stat) => stat.value.trim() && stat.label.trim());

        if (nextStats.length) {
          setStatistics(nextStats);
        }
      }

      if (data.home_servicesPreview) {
        setServicesPreview({
          label: data.home_servicesPreview.label?.value || DEFAULT_SERVICES_PREVIEW.label,
          headline: data.home_servicesPreview.headline?.value || DEFAULT_SERVICES_PREVIEW.headline,
          ctaText: data.home_servicesPreview.ctaText?.value || DEFAULT_SERVICES_PREVIEW.ctaText,
          ctaLink: data.home_servicesPreview.ctaLink?.value || DEFAULT_SERVICES_PREVIEW.ctaLink
        });

        if (data.home_servicesPreview.services?.value) {
          let rawServices = data.home_servicesPreview.services.value;
          if (typeof rawServices === 'string') {
            try {
              rawServices = JSON.parse(rawServices);
            } catch {
              rawServices = [];
            }
          }

          const servicesArray = Array.isArray(rawServices) ? rawServices : [];
          const nextServices: Service[] = servicesArray
            .map((service: any, index: number) => ({
              id: service?.id || `service_${index + 1}`,
              title: typeof service?.title === 'string' ? service.title : '',
              description: typeof service?.description === 'string' ? service.description : ''
            }))
            .filter((service: Service) => service.title.trim() && service.description.trim());

          if (nextServices.length) {
            setServices(nextServices);
          }
        }
      }

      if (data.home_featuredEvents) {
        setFeaturedEvents({
          label: data.home_featuredEvents.label?.value || DEFAULT_FEATURED_EVENTS.label,
          headline: data.home_featuredEvents.headline?.value || DEFAULT_FEATURED_EVENTS.headline,
          viewAllText: data.home_featuredEvents.viewAllText?.value || DEFAULT_FEATURED_EVENTS.viewAllText,
          viewAllLink: data.home_featuredEvents.viewAllLink?.value || DEFAULT_FEATURED_EVENTS.viewAllLink,
          description: data.home_featuredEvents.description?.value || DEFAULT_FEATURED_EVENTS.description
        });

        if (data.home_featuredEvents.events?.value) {
          let rawEvents = data.home_featuredEvents.events.value;
          if (typeof rawEvents === 'string') {
            try {
              rawEvents = JSON.parse(rawEvents);
            } catch {
              rawEvents = [];
            }
          }

          const eventsArray = Array.isArray(rawEvents) ? rawEvents : [];
          const nextEvents: FeaturedEvent[] = eventsArray
            .map((event: any, index: number) => ({
              id: event?.id || `event_${index + 1}`,
              title: typeof event?.title === 'string' ? event.title : '',
              location: typeof event?.location === 'string' ? event.location : '',
              image: typeof event?.image === 'string' ? event.image : ''
            }))
            .filter((event: FeaturedEvent) => event.title.trim() && event.location.trim() && event.image.trim());

          if (nextEvents.length) {
            setEvents(nextEvents);
          }
        }
      }

      if (data.home_whyDreamscape) {
        let rawFeatures = data.home_whyDreamscape.features?.value;
        if (typeof rawFeatures === 'string') {
          try {
            rawFeatures = JSON.parse(rawFeatures);
          } catch {
            rawFeatures = [];
          }
        }

        const featuresArray = Array.isArray(rawFeatures) ? rawFeatures : [];
        const nextFeatures = featuresArray
          .map((feature: any) => (typeof feature === 'string' ? feature : ''))
          .map((feature: string) => feature.trim())
          .filter(Boolean);

        setWhyDreamscape({
          label: data.home_whyDreamscape.label?.value || DEFAULT_WHY.label,
          headline: data.home_whyDreamscape.headline?.value || DEFAULT_WHY.headline,
          features: nextFeatures.length ? nextFeatures : DEFAULT_WHY.features
        });
      }

      if (data.home_cta) {
        setCtaSection({
          headline: data.home_cta.headline?.value || DEFAULT_CTA.headline,
          subheadline: data.home_cta.subheadline?.value || DEFAULT_CTA.subheadline,
          description: data.home_cta.description?.value || DEFAULT_CTA.description,
          details: data.home_cta.details?.value || DEFAULT_CTA.details
        });
      }
    } catch {
      // ignore and keep defaults
    }
  }, [initialGrouped]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, []);

  // Enable auto-refresh
  useAutoRefresh({
    refreshFn: fetchContent,
    enabled: true,
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const servicesCtaHref = servicesPreview.ctaLink || DEFAULT_SERVICES_PREVIEW.ctaLink;
  const servicesCtaText = servicesPreview.ctaText || DEFAULT_SERVICES_PREVIEW.ctaText;
  const featuredCtaHref = featuredEvents.viewAllLink || DEFAULT_FEATURED_EVENTS.viewAllLink;
  const featuredCtaText = featuredEvents.viewAllText || DEFAULT_FEATURED_EVENTS.viewAllText;
  return (
    <div className="w-full overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[80svh] w-full flex items-center justify-center overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: currentSlide === index ? 1 : 0
            }}>
            <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay */}
            <img
              src={slide.image}
              alt={
                index === 0
                  ? 'Elegant wedding reception'
                  : index === 1
                    ? 'Candlelit luxury reception setup'
                    : 'Elegant couple portrait'
              }
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        <div className="relative z-20 text-center px-4 sm:px-6 max-w-4xl mx-auto mt-20 md:mt-24">
          <ScrollReveal direction="up" delay={200}>
            <h1 className="text-[2rem] xs:text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-[0.95]">
              {heroText.headline}
              <br />
              {heroText.subheadline}
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <p className="text-white/90 text-sm xs:text-base md:text-base lg:text-lg font-light mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              {heroText.description}
            </p>
          </ScrollReveal>

          <ScrollReveal
            direction="up"
            delay={600}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">

            <Link href="/consultation-editorial" className="w-full sm:w-auto max-w-xs">
              <Button
                className="min-h-12 rounded-full px-6 sm:px-8 text-sm tracking-[0.14em] uppercase bg-brand-purple hover:bg-brand-pink text-white w-full transition-colors">

                Book a Consultation
              </Button>
            </Link>
            <Link href="/portfolio" className="w-full sm:w-auto max-w-xs">
              <Button
                variant="outline"
                className="min-h-12 rounded-full px-6 sm:px-8 text-sm tracking-[0.14em] uppercase border-white text-white hover:bg-white hover:text-brand-dark w-full transition-colors bg-transparent">

                View Blog
              </Button>
            </Link>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={800}>
            <p className="text-white/70 text-[0.65rem] xs:text-xs tracking-[0.16em] uppercase mt-8 md:mt-12 px-4">
              {heroText.bookingNote}
            </p>
          </ScrollReveal>
        </div>

        {/* Dot Navigation */}
        <div className="absolute bottom-8 xs:bottom-10 left-0 right-0 z-20 flex justify-center gap-2 xs:gap-3 px-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 xs:h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white w-8 xs:w-6' : 'bg-white/50 w-3 xs:w-2'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* BRAND INTRO */}
      <section className="py-16 sm:py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <ScrollReveal direction="right" className="w-full lg:w-1/2">
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0">
                <img
                  src={brandIntro.image}
                  alt="Elegant table setting"
                  className="w-full h-full object-cover rounded-sm" />

                <div className="absolute -bottom-4 xs:-bottom-6 -right-4 xs:-right-6 w-2/3 aspect-square bg-brand-light -z-10" />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" className="w-full lg:w-1/2">
              <h2 className="text-xs sm:text-sm tracking-[0.16em] uppercase text-brand-gray mb-3 sm:mb-4">
                {brandIntro.label}
              </h2>
              <h3 className="text-2xl xs:text-3xl md:text-4xl font-serif text-brand-dark mb-6 sm:mb-8 leading-tight">
                {brandIntro.headline}
              </h3>
              <p className="text-brand-gray font-light leading-relaxed mb-4 sm:mb-6 text-sm xs:text-base">
                {brandIntro.paragraph1}
              </p>
              <p className="text-brand-gray font-light leading-relaxed mb-6 sm:mb-8 text-sm xs:text-base">
                {brandIntro.paragraph2}
              </p>
              <div className="pt-4 sm:pt-6 border-t border-brand-gray/20">
                <p className="text-xs sm:text-sm tracking-widest uppercase text-brand-purple font-medium">
                  {brandIntro.locationNote}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* STATISTICS BANNER */}
      <section className="py-12 sm:py-14 md:py-16 bg-brand-purple text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            {statistics.map((stat, index) => (
              <ScrollReveal key={stat.id || index} delay={(index + 1) * 100}>
                <p className="text-3xl xs:text-4xl font-serif mb-2">{stat.value}</p>
                <p className="text-[0.65rem] xs:text-xs tracking-widest uppercase text-white/70">
                  {stat.label}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="py-20 lg:py-32 bg-brand-light">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal
            direction="up"
            className="text-center max-w-2xl mx-auto mb-16">
            
            <h2 className="text-sm tracking-[0.16em] uppercase text-brand-gray mb-4">
              {servicesPreview.label}
            </h2>
            <h3 className="text-3xl md:text-4xl font-serif text-brand-dark">
              {servicesPreview.headline}
            </h3>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service, index) => (
              <ScrollReveal key={service.id || index} delay={index * 100} direction="up">
                <div className="bg-white p-6 md:p-8 h-full flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-transparent hover:border-brand-pink/20">
                  <div>
                    <h4 className="font-serif text-xl text-brand-dark mb-4 group-hover:text-brand-purple transition-colors">
                      {service.title}
                    </h4>
                    <p className="text-sm text-brand-gray font-light leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className="mt-8 w-8 h-[1px] bg-brand-purple group-hover:w-16 transition-all duration-300" />
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center">
            <Link href={servicesCtaHref}>
              <Button
                variant="outline"
                className="min-h-12 rounded-full px-6 sm:px-8 text-sm tracking-[0.14em] uppercase border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors">
                {servicesCtaText}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="py-16 sm:py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 sm:mb-16 gap-4 sm:gap-6">
            <ScrollReveal direction="right" className="max-w-xl">
              <h2 className="text-xs sm:text-sm tracking-[0.2em] uppercase text-brand-gray mb-3 sm:mb-4">
                {featuredEvents.label}
              </h2>
              <h3 className="text-2xl xs:text-3xl md:text-4xl font-serif text-brand-dark mb-4 sm:mb-6">
                {featuredEvents.headline}
              </h3>
              <p className="text-brand-gray font-light leading-relaxed text-sm xs:text-base">
                {featuredEvents.description}
              </p>
            </ScrollReveal>
            <ScrollReveal direction="left">
              <Link href={featuredCtaHref}>
                <Button
                  className="min-h-12 rounded-full px-6 sm:px-8 text-sm tracking-[0.14em] uppercase bg-brand-purple hover:bg-brand-pink text-white transition-colors">

                  {featuredCtaText}
                </Button>
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {events.map((event, index) => (
              <ScrollReveal key={event.id || index} delay={index * 100} direction="up">
                <Link href={featuredCtaHref}>
                  <div
                  className="group relative aspect-[3/4] sm:aspect-[4/3] overflow-hidden cursor-pointer">

                    <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8">
                      <span className="inline-block px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[0.6rem] sm:text-[0.65rem] tracking-widest uppercase mb-2 sm:mb-3">
                        {event.location}
                      </span>
                      <h4 className="text-xl xs:text-2xl font-serif text-white leading-tight">
                        {event.title}
                      </h4>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DREAMSCAPE */}
      <section className="py-16 sm:py-20 md:py-24 bg-brand-light">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal
            direction="up"
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">

            {whyDreamscape.label ? (
              <h2 className="text-xs sm:text-sm tracking-[0.2em] uppercase text-brand-gray mb-3 sm:mb-4">
                {whyDreamscape.label}
              </h2>
            ) : null}
            <h2 className="text-2xl xs:text-3xl md:text-4xl font-serif text-brand-dark mb-4 sm:mb-6">
              {whyDreamscape.headline}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {whyDreamscape.features.map((point, index) => (
              <ScrollReveal key={index} delay={index * 100} direction="up">
                <div className="text-center px-2 sm:px-4">
                  <div className="w-10 sm:w-12 h-[1px] bg-brand-pink mx-auto mb-4 sm:mb-6" />
                  <p className="text-brand-dark font-serif text-base xs:text-lg leading-relaxed">
                    {point}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* LOVE NOTES SNIPPET */}
      <section className="py-16 sm:py-20 lg:py-32 bg-brand-dark text-white text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <ScrollReveal direction="up">
            <h2 className="text-xs sm:text-sm tracking-[0.2em] uppercase text-white/50 mb-12 sm:mb-16">
              Love Notes
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <ScrollReveal direction="right" delay={100}>
              <p className="font-serif text-lg xs:text-xl md:text-2xl italic leading-relaxed mb-4 sm:mb-6 text-white/90 px-2">
                "Dreamscape truly made my dream birthday come true..."
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <div className="w-6 sm:w-8 h-[1px] bg-brand-pink" />
                <p className="text-[0.7rem] sm:text-sm tracking-widest uppercase text-white/70">
                  Nneoma Achioso
                </p>
                <div className="w-6 sm:w-8 h-[1px] bg-brand-pink" />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={200}>
              <p className="font-serif text-lg xs:text-xl md:text-2xl italic leading-relaxed mb-4 sm:mb-6 text-white/90 px-2">
                "My grad party turned out amazing..."
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <div className="w-6 sm:w-8 h-[1px] bg-brand-pink" />
                <p className="text-[0.7rem] sm:text-sm tracking-widest uppercase text-white/70">
                  Dr. Chika Obetta
                </p>
                <div className="w-6 sm:w-8 h-[1px] bg-brand-pink" />
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" delay={300}>
            <Link
              href="/love-notes"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-pink px-4 sm:px-6 text-sm tracking-[0.14em] uppercase text-brand-pink hover:bg-brand-pink hover:text-white transition-colors">
              Read More
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-24 lg:py-32 bg-white text-center">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <h2 className="text-3xl xs:text-4xl md:text-5xl font-serif text-brand-dark mb-8 sm:mb-10 px-2">
              {ctaSection.headline || DEFAULT_CTA.headline}
            </h2>
            {ctaSection.subheadline ? (
              <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-brand-gray mb-3 sm:mb-4">
                {ctaSection.subheadline}
              </p>
            ) : null}
            {ctaSection.description ? (
              <p className="mx-auto mb-8 sm:mb-10 max-w-2xl text-brand-gray font-light leading-relaxed px-4 text-sm xs:text-base">
                {ctaSection.description}
              </p>
            ) : null}
            <Link href="/consultation-editorial">
              <Button
                className="min-h-12 rounded-full px-6 sm:px-8 xs:px-10 text-sm tracking-[0.14em] uppercase bg-brand-purple hover:bg-brand-pink text-white transition-colors">

                Book Your Consultation
              </Button>
            </Link>
            {ctaSection.details ? (
              <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-[0.65rem] xs:text-xs tracking-[0.08em] uppercase text-brand-gray/80 px-4">
                {ctaSection.details}
              </p>
            ) : null}
          </ScrollReveal>
        </div>
      </section>
    </div>);

}
