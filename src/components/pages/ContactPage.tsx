'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion';
import { ScrollReveal } from '../ScrollReveal';
import { useAutoRefresh } from '@/src/lib/hooks/useAutoRefresh';

const DEFAULT_CONTACT_CARDS = [
  {
    label: 'Email Address',
    value: 'dreamscapeventts@gmail.com',
    href: 'mailto:dreamscapeventts@gmail.com'
  },
  {
    label: 'Phone Number',
    value: '+1 (365) 987-9393',
    href: 'tel:+13659879393'
  },
  {
    label: 'Our Location',
    value: 'Serving the Greater Toronto Area (GTA), Canada & Worldwide.',
    href: '/consultation-editorial'
  }
] as const;

type ContactCard = { label: string; value: string; href: string };

export function ContactPage({ initialCards }: { initialCards?: ContactCard[] }) {
  const [contactCards, setContactCards] = useState<ContactCard[]>(
    initialCards?.length ? initialCards : [...DEFAULT_CONTACT_CARDS]
  );

  // Fetch contact cards with auto-refresh capability
  const fetchContactCards = useCallback(async () => {
    if (initialCards?.length) return;
    try {
      const res = await fetch('/api/site-content?page=contact&section=contact_info&_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const data = json.grouped?.contact_contact_info || {};
        const cards = data.cards?.value || [];
        if (cards.length > 0) {
          setContactCards(cards);
        }
      }
    } catch (error) {
      console.error('Failed to load contact cards:', error);
    }
  }, [initialCards?.length]);

  // Initial fetch
  useEffect(() => {
    fetchContactCards();
  }, []);

  // Enable auto-refresh
  useAutoRefresh({
    refreshFn: fetchContactCards,
    enabled: true,
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });
  return (
    <div className="w-full bg-brand-light min-h-screen pt-40 md:pt-44 pb-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal direction="up" className="mb-24 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-brand-pink">
            Contact
          </p>
          <h1 className="mx-auto mb-5 max-w-3xl text-4xl font-serif leading-tight text-brand-dark sm:text-5xl md:text-6xl">
            Get in touch, let us know how we can help
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-brand-gray sm:text-lg">
            Dreamscape Curated Events plans weddings, private celebrations, and
            elevated brand experiences with clarity, elegance, and structure.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" className="mb-24 pt-4 md:pt-6">
          <section>
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-base uppercase tracking-[0.24em] text-brand-pink md:text-lg">
                Contact Details
              </p>
              <h2 className="mb-4 text-4xl font-serif leading-tight text-brand-dark sm:text-5xl">
                Reach Dreamscape directly
              </h2>
              <p className="text-base leading-relaxed text-brand-gray">
                Choose the contact method that fits you best, whether you prefer a
                detailed email, a direct call, or a quick WhatsApp message.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {contactCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="border-t border-brand-purple/10 px-0 py-5 transition-colors hover:border-brand-pink/30 md:pr-6">
                  <p className="mb-2 text-[0.68rem] uppercase tracking-[0.18em] text-brand-pink">
                    {card.label}
                  </p>
                  <p className="text-sm leading-relaxed text-brand-dark sm:text-base">
                    {card.value}
                  </p>
                </a>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal direction="up" className="mb-24">
          <section>
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-base uppercase tracking-[0.24em] text-brand-pink md:text-lg">
                Inquiry Form
              </p>
              <h2 className="mb-4 text-4xl font-serif leading-tight text-brand-dark sm:text-5xl">
                Share your event details
              </h2>
              <p className="text-base leading-relaxed text-brand-gray">
                Tell us what you are planning and Dreamscape will guide you toward
                the right next step for your celebration or brand experience.
              </p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-brand-gray">Your Name</label>
                  <Input
                    placeholder="Your name"
                    className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-gray">Email address</label>
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-brand-gray">Message</label>
                <Textarea
                  placeholder="Write something..."
                  className="min-h-[220px] rounded-[1.5rem] border-brand-purple/12 bg-white px-5 py-4"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-brand-gray">
                  Prefer to book directly? Use the consultation page or reach us
                  via WhatsApp and email.
                </p>
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-brand-purple px-8 text-sm uppercase tracking-[0.14em] text-white hover:bg-brand-pink">
                  Send Message
                </Button>
              </div>
            </form>

            <div className="mt-20 mb-8 max-w-2xl">
              <p className="mb-3 text-base uppercase tracking-[0.24em] text-brand-pink md:text-lg">
                Service Area
              </p>
              <h2 className="mb-4 text-4xl font-serif leading-tight text-brand-dark sm:text-5xl">
                Based in Toronto, available worldwide
              </h2>
              <p className="text-base leading-relaxed text-brand-gray">
                We serve clients across the Greater Toronto Area, throughout
                Canada, and for destination celebrations around the world.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-brand-purple/10">
              <iframe
                title="Dreamscape service area map"
                src="https://www.google.com/maps?q=Toronto%2C%20Ontario&z=10&output=embed"
                className="h-[460px] w-full border-0 md:h-[560px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal direction="up" className="pt-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <p className="mb-3 text-base uppercase tracking-[0.24em] text-brand-pink md:text-lg">
                FAQ
              </p>
              <h2 className="text-4xl font-serif leading-tight text-brand-dark sm:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-brand-gray">
                A few quick answers to common questions about planning support,
                destination availability, and how to begin.
              </p>
            </div>

            <Accordion
              type="single"
              collapsible
              className="w-full border-t border-brand-purple/10 px-0 py-4 sm:px-0">
              <AccordionItem value="item-1" className="border-brand-gray/20">
                <AccordionTrigger className="text-left text-lg font-serif text-brand-dark hover:text-brand-pink hover:no-underline">
                  Do you offer partial planning?
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-brand-gray">
                  Yes — we offer multiple planning tiers for weddings depending on
                  your needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-brand-gray/20">
                <AccordionTrigger className="text-left text-lg font-serif text-brand-dark hover:text-brand-pink hover:no-underline">
                  Do you travel?
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-brand-gray">
                  Yes, we plan destination weddings and events worldwide.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-brand-gray/20">
                <AccordionTrigger className="text-left text-lg font-serif text-brand-dark hover:text-brand-pink hover:no-underline">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-brand-gray">
                  Book a consultation through our website.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default ContactPage;