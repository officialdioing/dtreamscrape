'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '../ScrollReveal';
import type { BlogPost } from '@/src/lib/blog-posts';
import { mapPortfolioItemToPublicPost } from '@/src/lib/public-posts';
import { useAutoRefresh } from '@/src/lib/hooks/useAutoRefresh';

export function BlogPage({ initialPosts }: { initialPosts?: BlogPost[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState<BlogPost[] | null>(initialPosts?.length ? initialPosts : null);

  const heroSlides = [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'
  ];

  // Fetch blog posts with auto-refresh capability
  const fetchPosts = useCallback(async () => {
    if (initialPosts?.length) return;
    try {
      const res = await fetch(`/api/blog-posts?_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) return;
      const rows = Array.isArray(json?.posts) ? json.posts : [];
      const mapped = rows.map(mapPortfolioItemToPublicPost).filter((p: BlogPost) => p.id && p.title);
      setPosts(mapped);
    } catch {
      setPosts([]);
    }
  }, [initialPosts?.length]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  // Enable auto-refresh
  useAutoRefresh({
    refreshFn: fetchPosts,
    enabled: true,
    refetchOnFocus: false,
    refetchOnVisibilityChange: false
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const isPostsLoading = posts === null;
  const resolvedPosts = posts ?? [];
  const featuredPost = isPostsLoading ? null : (resolvedPosts[0] || null);
  const remainingPosts = isPostsLoading ? [] : resolvedPosts.slice(1);

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] pb-16 sm:pb-24">
      <section className="relative min-h-[38svh] xs:min-h-[42svh] overflow-hidden pt-20 md:min-h-[52svh] md:pt-28">
        {heroSlides.map((slide, index) => (
          <div
            key={slide}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: currentSlide === index ? 1 : 0 }}>
            <img
              src={slide}
              alt="Dreamscape journal hero"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,25,0.54)_0%,rgba(20,14,25,0.64)_42%,rgba(20,14,25,0.8)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_36%)]" />

        <div className="relative z-10 mx-auto flex min-h-[38svh] xs:min-h-[42svh] max-w-[1360px] items-end px-4 sm:px-5 pb-8 xs:pb-10 md:min-h-[52svh] md:px-10 md:pb-14">
          <ScrollReveal direction="up">
            <div className="mx-auto w-full max-w-4xl px-4 xs:px-6 py-6 xs:py-8 text-center sm:px-8 md:px-10 md:py-10">
              <div className="mx-auto mb-4 xs:mb-5 h-px w-16 xs:w-20 bg-white/45" />
              <p className="mb-4 xs:mb-5 text-[0.7rem] xs:text-[0.8rem] font-semibold uppercase tracking-[0.34em] text-white">
                Dreamscape Journal
              </p>
              <h1 className="text-[2.5rem] xs:text-5xl font-serif leading-[0.9] text-white sm:text-6xl md:text-7xl lg:text-[5.8rem]">
                Stories With
                <br />
                Structure And Soul
              </h1>
              <p className="mx-auto mt-6 xs:mt-8 max-w-[44rem] text-sm xs:text-base font-medium leading-[1.8] text-white md:text-lg px-2">
                A journal of weddings and celebrations shaped through intentional
                design, refined production, and the quiet details that make an
                event feel unforgettable.
              </p>

              <div className="mt-8 xs:mt-10 flex items-center justify-center gap-2 xs:gap-3 px-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 xs:h-2 rounded-full transition-all ${
                      currentSlide === index ? 'w-8 xs:w-10 bg-white' : 'w-3 xs:w-2 bg-white/55'
                    }`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="pt-20 xs:pt-24 sm:pt-28">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-5 md:px-10">
          <ScrollReveal direction="up">
            <div className="mb-12 xs:mb-16 max-w-3xl">
              <p className="mb-3 xs:mb-4 text-[0.65rem] xs:text-[0.72rem] uppercase tracking-[0.28em] text-brand-pink">
                Featured Story
              </p>
              <h2 className="text-2xl xs:text-3xl font-serif leading-tight text-brand-dark md:text-5xl">
                A closer look at the events we document with intention
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-8 xs:gap-10 border-b border-brand-purple/10 pb-16 xs:pb-20 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
            {isPostsLoading ? (
              <>
                <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#f5f1f2]" />
                <div className="max-w-xl">
                  <div className="h-3 w-40 rounded bg-brand-purple/10" />
                  <div className="mt-5 h-10 w-3/4 rounded bg-brand-purple/10" />
                  <div className="mt-4 h-3 w-48 rounded bg-brand-purple/10" />
                  <div className="mt-6 h-4 w-full rounded bg-brand-purple/10" />
                  <div className="mt-3 h-4 w-5/6 rounded bg-brand-purple/10" />
                  <div className="mt-8 h-11 w-40 rounded-full bg-brand-purple/10" />
                </div>
              </>
            ) : featuredPost ? (
              <>
                <ScrollReveal direction="up">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem]">
                    <img
                      src={featuredPost.img}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={120}>
                  <div className="max-w-xl">
                    <p className="mb-3 xs:mb-4 text-[0.65rem] xs:text-[0.72rem] uppercase tracking-[0.28em] text-brand-pink">
                      {featuredPost.category}
                    </p>
                    <h3 className="text-2xl xs:text-3xl font-serif leading-tight text-brand-dark md:text-5xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-3 xs:mt-4 text-[0.65rem] xs:text-[0.72rem] uppercase tracking-[0.22em] text-brand-gray">
                      {featuredPost.date} / {featuredPost.location || '—'}
                    </p>
                    <p className="mt-4 xs:mt-6 text-sm xs:text-base leading-relaxed text-brand-gray md:text-lg">
                      {featuredPost.desc}
                    </p>
                    <p className="mt-4 xs:mt-5 text-sm xs:text-base leading-relaxed text-brand-gray">
                      {featuredPost.contentBlocks?.find((b) => b.type === 'text')?.content ||
                        featuredPost.fullStory[0]}
                    </p>
                    <Link
                      href={`/blog/${featuredPost.id}`}
                      className="mt-6 xs:mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-purple px-5 xs:px-6 text-sm uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-pink">
                      Read Story
                    </Link>
                  </div>
                </ScrollReveal>
              </>
            ) : (
              <div className="rounded-3xl border border-brand-purple/10 bg-white px-8 py-10 text-center text-brand-gray xl:col-span-2">
                No blog posts yet.
              </div>
            )}
          </div>

          <div className="pt-16 xs:pt-20 sm:pt-24">
            <ScrollReveal direction="up">
              <div className="mb-8 xs:mb-10 flex items-end justify-between gap-4 xs:gap-6 border-b border-brand-purple/10 pb-4 xs:pb-6">
                <div>
                  <p className="mb-2 xs:mb-3 text-[0.65rem] xs:text-[0.72rem] uppercase tracking-[0.28em] text-brand-pink">
                    Recent Stories
                  </p>
                  <h3 className="text-xl xs:text-2xl font-serif leading-tight text-brand-dark md:text-4xl">
                    More celebrations, milestones, and curated experiences
                  </h3>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-8 xs:gap-10 md:grid-cols-2 xl:grid-cols-3 xl:gap-14">
              {isPostsLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="mb-4 xs:mb-6 aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#f5f1f2]" />
                      <div className="mb-2 xs:mb-3 h-2.5 xs:h-3 w-20 xs:w-24 rounded bg-brand-purple/10" />
                      <div className="mb-3 xs:mb-4 h-6 xs:h-7 w-3/4 rounded bg-brand-purple/10" />
                      <div className="mb-1.5 xs:mb-2 h-3.5 xs:h-4 w-full rounded bg-brand-purple/10" />
                      <div className="mb-4 xs:mb-6 h-3.5 xs:h-4 w-5/6 rounded bg-brand-purple/10" />
                      <div className="h-px w-full bg-brand-purple/10" />
                    </div>
                  ))
                : remainingPosts.length ? remainingPosts.map((post, index) => (
                    <ScrollReveal key={post.id} direction="up" delay={index * 100}>
                      <Link href={`/blog/${post.id}`} className="group block text-left">
                        <div className="mb-4 xs:mb-6 aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#f5f1f2]">
                          <img
                            src={post.img}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <p className="mb-2 xs:mb-3 text-[0.6rem] xs:text-[0.68rem] uppercase tracking-[0.22em] text-brand-gray">
                          {post.date}
                        </p>
                        <h4 className="mb-3 xs:mb-4 text-xl xs:text-2xl font-serif leading-tight text-brand-dark transition-colors group-hover:text-brand-pink">
                          {post.title}
                        </h4>
                        <p className="mb-4 xs:mb-6 text-sm font-light leading-relaxed text-brand-gray">
                          {post.desc}
                        </p>
                        <div className="flex items-center justify-between border-t border-brand-purple/10 pt-4 xs:pt-5">
                          <span className="text-[0.6rem] xs:text-[0.68rem] uppercase tracking-[0.2em] text-brand-gray">
                            {post.location || '—'}
                          </span>
                          <span className="text-[0.6rem] xs:text-[0.68rem] font-medium uppercase tracking-[0.22em] text-brand-purple transition-colors group-hover:text-brand-pink">
                            Read Story
                          </span>
                        </div>
                      </Link>
                    </ScrollReveal>
                  )) : (
                    <div className="rounded-3xl border border-brand-purple/10 bg-white px-6 xs:px-8 py-8 xs:py-10 text-center text-brand-gray md:col-span-2 xl:col-span-3">
                      No published stories to show yet.
                    </div>
                  )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BlogPage;
