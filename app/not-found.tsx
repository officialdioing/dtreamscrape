'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  useEffect(() => {
    document.body.classList.add('not-found-route');
    return () => {
      document.body.classList.remove('not-found-route');
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-light">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,100,147,0.06),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.66),rgba(252,250,247,0))]" />

      <section className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="w-full border-t border-brand-purple/10 pt-10">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-brand-pink">
            404 / Not Found
          </p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
            <div>
              <h1 className="max-w-[10ch] font-serif text-5xl leading-[0.88] text-brand-dark sm:text-6xl lg:text-[4.75rem]">
                This page is no longer available.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-brand-gray sm:text-lg">
                The address may be incorrect, the page may have moved, or the link may be outdated.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-purple px-7 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-pink"
                >
                  Return Home
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-purple/14 bg-white/70 px-7 text-sm font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:border-brand-pink hover:text-brand-pink"
                >
                  View Stories
                </Link>
              </div>
            </div>

            <div className="border-l border-brand-purple/10 pl-0 lg:pl-8">
              <div className="font-serif text-[4.5rem] leading-none text-brand-purple/85 sm:text-[5.5rem]">
                404
              </div>
              <div className="mt-5 space-y-3 text-sm text-brand-gray">
                <Link href="/about" className="block transition-colors hover:text-brand-dark">
                  About
                </Link>
                <Link href="/services" className="block transition-colors hover:text-brand-dark">
                  Services
                </Link>
                <Link href="/contact" className="block transition-colors hover:text-brand-dark">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
