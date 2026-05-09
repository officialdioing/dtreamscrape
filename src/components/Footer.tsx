'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterConfig = {
  exploreLinks?: FooterLink[];
  companyLinks?: FooterLink[];
  connectLinks?: FooterLink[];
  copyright?: string;
};

const defaultFooterGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Blog', href: '/portfolio' },
      { label: 'FAQ', href: '/faq' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Love Notes', href: '/love-notes' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { label: 'Instagram', href: 'https://instagram.com/dreamscapeventts', external: true },
      { label: 'Email', href: 'mailto:dreamscapeventts@gmail.com', external: true },
      { label: 'WhatsApp', href: 'https://wa.me/13659879393', external: true },
      { label: 'Consultation', href: '/consultation-editorial' }
    ]
  }
];

function normalizeLinks(links: unknown): FooterLink[] {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => {
      if (!link || typeof link !== 'object') return null;
      const label = typeof (link as any).label === 'string' ? (link as any).label : '';
      const href = typeof (link as any).href === 'string' ? (link as any).href : '';
      if (!label.trim() || !href.trim()) return null;
      return { label, href };
    })
    .filter((link): link is FooterLink => Boolean(link));
}

export function Footer({ config }: { config?: FooterConfig }) {
  const groups = React.useMemo(() => {
    if (!config) return defaultFooterGroups;

    const explore = normalizeLinks(config.exploreLinks);
    const company = normalizeLinks(config.companyLinks);
    const connect = normalizeLinks(config.connectLinks);

    const connectWithAdmin = (() => {
      const hasLogin = connect.some((l) => l.href === '/admin/login' || l.label.toLowerCase() === 'login');
      return hasLogin ? connect : [...connect, { label: 'Login', href: '/admin/login' }];
    })();

    return [
      { title: 'Explore', links: explore.length ? explore : defaultFooterGroups[0].links },
      { title: 'Company', links: company.length ? company : defaultFooterGroups[1].links },
      { title: 'Connect', links: connectWithAdmin.length ? connectWithAdmin : defaultFooterGroups[2].links },
    ];
  }, [config]);

  const copyright =
    (config?.copyright && String(config.copyright).trim()) ||
    `© ${new Date().getFullYear()} Dreamscape Curated Events Inc. All rights reserved.`;

  return (
    <footer className="bg-brand-dark pt-10 pb-6 border-t border-white/10 text-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1.2fr] lg:gap-14">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex">
              <div className="relative h-16 w-44 md:h-18 md:w-52">
                <Image
                  src="/logo.png"
                  alt="Dreamscape Curated Events"
                  fill
                  sizes="(min-width: 768px) 208px, 176px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="mt-5 text-sm text-white/68 leading-relaxed">
              Toronto-based | Available Worldwide
            </p>
            <p className="mt-2 text-sm text-white/68 leading-relaxed">
              Luxury weddings, private celebrations, and elevated brand experiences.
            </p>
            <p className="mt-3 text-xs font-semibold tracking-wider uppercase text-brand-pink">
              Now booking 2026 & 2027 events
            </p>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 w-full rounded-full border border-white/12 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-brand-pink"
              />
              <button
                type="submit"
                className="h-11 rounded-full bg-white px-5 text-sm text-brand-purple transition-colors hover:bg-brand-pink hover:text-white">
                Submit
              </button>
            </form>

            <p className="mt-4 max-w-xs text-[0.72rem] leading-relaxed text-white/42">
              By subscribing you agree to receive updates from Dreamscape Curated Events.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/42 mb-4">
                  {group.title}
                </p>
                <div className="flex flex-col gap-3">
                  {group.links.map((link) =>
                    link.external || link.href.startsWith('http') || link.href.startsWith('mailto:') ? (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                        className="text-sm text-white/78 transition-colors hover:text-brand-pink">
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-sm text-white/78 transition-colors hover:text-brand-pink">
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-[0.72rem] text-white/38">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
