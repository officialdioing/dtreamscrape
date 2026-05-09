'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '../ScrollReveal';

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Nneoma Achioso',
    quote: 'Dreamscape truly made my dream birthday come true…',
    img: 'https://images.unsplash.com/photo-1530103862676-de8892b07439?q=80&w=2070&auto=format&fit=crop'
  },
  {
    name: 'Dr. Chika Obetta',
    quote: 'My grad party turned out amazing…',
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop'
  }
];

type Testimonial = { name: string; quote: string; img: string };

export function LoveNotesPage({ initialTestimonials }: { initialTestimonials?: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initialTestimonials?.length ? initialTestimonials : DEFAULT_TESTIMONIALS
  );

  // Fetch testimonials from database
  useEffect(() => {
    if (initialTestimonials?.length) return;
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('/api/site-content?page=love_notes&section=testimonials', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const data = json.grouped?.love_notes_testimonials || {};
          const items = data.items?.value || [];
          if (items.length > 0) {
            setTestimonials(items);
          }
        }
      } catch (error) {
        console.error('Failed to load testimonials:', error);
      }
    };

    fetchTestimonials();
  }, [initialTestimonials?.length]);

  return (
    <div className="w-full bg-white min-h-screen pb-24">
      {/* HERO BANNER */}
      <section className="relative min-h-[42svh] md:h-[50vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
          alt="Love Notes Hero"
          className="absolute inset-0 w-full h-full object-cover" />

        <div className="relative z-20 text-center px-4 sm:px-6 mt-20 md:mt-16">
          <ScrollReveal direction="up">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-white tracking-wide">
              Love Notes
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="max-w-2xl mx-auto text-center mb-20">
            <ScrollReveal direction="up">
              <p className="text-xs tracking-[0.18em] uppercase text-brand-pink mb-4">
                Client Experience
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl text-brand-dark mb-6">
                Words From Celebrations We Have Curated
              </h2>
              <p className="text-brand-gray leading-relaxed">
                A softer, more personal look at the way Dreamscape feels to the
                people who trusted us with their moments.
              </p>
            </ScrollReveal>
          </div>

          <div className="space-y-14">
            {testimonials.map((testimonial, index) =>
            <ScrollReveal key={index} direction="up" delay={100}>
                <article className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 md:gap-10 items-center rounded-[1.5rem] md:rounded-[2rem] border border-brand-purple/10 bg-brand-light/60 p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(64,21,63,0.06)]">
                  <div className="flex justify-center md:justify-start">
                    <div className="w-36 h-36 md:w-44 md:h-44 shrink-0 rounded-full overflow-hidden border border-brand-pink/20 shadow-lg">
                      <img
                        src={testimonial.img}
                        alt={testimonial.name}
                        className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="mb-5">
                      <p className="text-xs tracking-[0.18em] uppercase text-brand-pink">
                        Client Note
                      </p>
                    </div>
                    <p className="font-serif text-xl sm:text-2xl md:text-3xl italic text-brand-dark leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>
                    <div className="pt-5 border-t border-brand-purple/10">
                      <div>
                        <h3 className="text-lg md:text-xl text-brand-dark">
                          {testimonial.name}
                        </h3>
                        <p className="text-sm uppercase tracking-[0.14em] text-brand-gray mt-1">
                          Dreamscape Client
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            )}
          </div>

          {/* GOOGLE REVIEWS LINK */}
          <ScrollReveal
            direction="up"
            className="mt-32 text-center pt-16 border-t border-brand-gray/20">

            <a
              href="https://share.google/92zTFeUMHWdWSJW2o"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white transition-colors">

              <span className="text-sm uppercase tracking-[0.14em] font-medium">
                See All Reviews
              </span>
            </a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

export default LoveNotesPage;
