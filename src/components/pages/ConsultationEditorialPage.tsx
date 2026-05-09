'use client';

import Link from 'next/link';

const consultationOptions = [
  {
    slug: 'wedding-destination-social',
    title: 'Wedding / Destination Planning',
    image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop',
    description:
      'For couples seeking full planning, design direction, and seamless coordination for wedding celebrations, destination events, and refined guest experiences from beginning to final execution.',
  },
  {
    slug: 'event-design-styling',
    title: 'Event Design & Styling',
    image:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop',
    description:
      'A consultation focused on visual storytelling, styling direction, tablescape decisions, ambiance, and the design details that shape how your event feels from first impression to final reveal.',
  },
  {
    slug: 'pick-my-brain',
    title: 'Pick My Brain Session (1-Hour Virtual Consultation)',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop',
    description:
      'For clients who need strategic event guidance, vendor advice, or professional clarity before moving forward. Ideal for a focused conversation around planning decisions and next steps.',
  },
  {
    slug: 'real-time-assessment',
    title: 'Real-Time Event Assessment',
    image:
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop',
    description:
      'A consultation designed to review your current event progress, identify what is missing, and recommend the structure, support, and production touchpoints needed to move the experience forward with confidence.',
  },
];

export function ConsultationEditorialPage() {
  return (
    <div className="min-h-screen w-full bg-[#fbf8f6] pb-24 pt-0">
      <section className="relative min-h-[26svh] overflow-hidden border-y border-brand-purple/10 md:min-h-[32svh]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop"
            alt="Consultation background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,20,28,0.42),rgba(25,20,28,0.48))]" />
        </div>

        <div className="relative mx-auto flex min-h-[26svh] max-w-[1400px] items-end px-4 pb-8 pt-16 text-center sm:px-6 md:min-h-[32svh] md:pb-10 md:pt-20">
          <div className="mx-auto w-full">
            <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-white/80">
              Dreamscape Curated Events
            </p>
            <h1 className="text-3xl font-serif text-white sm:text-4xl md:text-[2.8rem]">
              Schedule A Consultation
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[940px] px-4 pt-16 sm:px-6 md:pt-20">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
          {consultationOptions.map((option) => (
            <article key={option.title} className="space-y-4">
              <div className="aspect-[4/3] overflow-hidden bg-[#f2ece8]">
                <img
                  src={option.image}
                  alt={option.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-[0.86rem] font-medium uppercase leading-[1.5] tracking-[0.08em] text-brand-dark md:text-[0.92rem]">
                  {option.title}
                </h2>
                <p className="text-sm leading-[1.9] text-brand-gray">
                  {option.description}
                </p>
              </div>

              <Link
                href={`/consultation?service=${option.slug}`}
                className="inline-flex min-h-10 items-center bg-brand-dark px-4 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-purple">
                Schedule A Consultation
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ConsultationEditorialPage;
