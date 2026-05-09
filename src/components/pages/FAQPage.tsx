'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '../ScrollReveal';
import { Minus, Plus } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

const DEFAULT_FAQS: FAQItem[] = [
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
];

export default function FAQPage({ initialFAQs }: { initialFAQs?: FAQItem[] }) {
  const [faqs, setFAQs] = useState<FAQItem[]>(initialFAQs?.length ? initialFAQs : DEFAULT_FAQS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialFAQs?.length) return;

    const loadFAQs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/site-content?page=faq&section=faqs', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const data = json.grouped?.faq_faqs;
          const rawFAQs = data?.items?.value;

          let parsedFAQs;
          if (typeof rawFAQs === 'string') {
            try {
              parsedFAQs = JSON.parse(rawFAQs);
            } catch {
              parsedFAQs = null;
            }
          } else if (Array.isArray(rawFAQs)) {
            parsedFAQs = rawFAQs;
          }

          if (Array.isArray(parsedFAQs) && parsedFAQs.length > 0) {
            setFAQs(parsedFAQs);
          }
        }
      } catch {
        // keep default FAQs
      } finally {
        setIsLoading(false);
      }
    };

    loadFAQs();
  }, [initialFAQs?.length]);

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full pt-24 pb-16 md:pt-32 md:pb-24 bg-white">
      {/* PAGE HEADER */}
      <section className="container mx-auto px-4 sm:px-6 py-12 lg:py-24 text-center max-w-4xl">
        <ScrollReveal direction="up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-brand-dark mb-6 md:mb-8 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-brand-gray font-light leading-relaxed text-base md:text-lg mb-8 md:mb-12 px-2">
            Find answers to common questions about our services, planning process, and how we can help bring your vision to life.
          </p>
          <div className="w-16 md:w-24 h-[1px] bg-brand-pink mx-auto" />
        </ScrollReveal>
      </section>

      {/* FAQ ITEMS */}
      <section className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {isLoading ? (
          <div className="space-y-4 md:space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="border border-brand-gray/20 rounded-lg p-6 md:p-8">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {faqs.map((faq, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 100}>
              <div className="border border-brand-gray/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left hover:bg-brand-light/50 transition-colors"
                >
                  <h3 className="text-lg md:text-xl font-serif text-brand-dark pr-8">
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-brand-purple flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-brand-purple flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <p className="text-brand-gray font-light leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
          </div>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="py-16 md:py-24 bg-brand-light mt-12">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark mb-6 md:mb-8">
              Still have questions?
            </h2>
            <p className="text-brand-gray font-light leading-relaxed mb-8 md:mb-10">
              We'd love to hear from you and discuss how we can help bring your vision to life.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full px-6 md:px-10 py-4 md:py-5 text-xs sm:text-sm tracking-wider uppercase bg-brand-purple hover:bg-brand-pink text-white transition-colors">
              Book a Consultation
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
