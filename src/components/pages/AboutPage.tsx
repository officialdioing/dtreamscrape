'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '../ScrollReveal';
import { useAutoRefresh } from '@/src/lib/hooks/useAutoRefresh';

type FounderContent = {
  label: string;
  name: string;
  role: string;
  bio1: string;
  bio2: string;
  quote: string;
  image: string;
};

type StoryContent = {
  title: string;
  content: string;
};

type PhilosophyContent = {
  title: string;
  content: string;
};

type TeamContent = {
  title: string;
  description: string;
};

export default function AboutPage({
  initialFounder,
  initialStory,
  initialPhilosophy,
  initialTeam
}: {
  initialFounder?: FounderContent;
  initialStory?: StoryContent;
  initialPhilosophy?: PhilosophyContent;
  initialTeam?: TeamContent;
}) {
  const [founder, setFounder] = useState<FounderContent | null>(initialFounder ?? null);
  const [story, setStory] = useState<StoryContent | null>(initialStory ?? null);
  const [philosophy, setPhilosophy] = useState<PhilosophyContent | null>(initialPhilosophy ?? null);
  const [team, setTeam] = useState<TeamContent | null>(initialTeam ?? null);
  const [isLoading, setIsLoading] = useState(
    !(initialFounder || initialStory || initialPhilosophy || initialTeam)
  );

  // Fetch about page content with auto-refresh capability
  const fetchContent = useCallback(async () => {
    if (initialFounder || initialStory || initialPhilosophy || initialTeam) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/site-content?page=about&_t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.grouped || {};

      if (data.about_founder) {
        setFounder({
          label: data.about_founder.label?.value || '',
          name: data.about_founder.name?.value || '',
          role: data.about_founder.role?.value || '',
          bio1: data.about_founder.bio1?.value || '',
          bio2: data.about_founder.bio2?.value || '',
          quote: data.about_founder.quote?.value || '',
          image: data.about_founder.image?.value || ''
        });
      }

      if (data.about_story) {
        setStory({
          title: data.about_story.title?.value || '',
          content: data.about_story.content?.value || ''
        });
      }

      if (data.about_philosophy) {
        setPhilosophy({
          title: data.about_philosophy.title?.value || '',
          content: data.about_philosophy.content?.value || ''
        });
      }

      if (data.about_team) {
        setTeam({
          title: data.about_team.title?.value || '',
          description: data.about_team.description?.value || ''
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [initialFounder, initialStory, initialPhilosophy, initialTeam]);

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

  const storyParagraphs = story?.content
    ? story.content.split(/\n{2,}/g).filter(Boolean)
    : [];

  const philosophyParagraphs = philosophy?.content
    ? philosophy.content.split(/\n{2,}/g).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="w-full pt-32 pb-24 bg-brand-light min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-purple border-t-transparent mb-4"></div>
          <p className="text-brand-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-32 pb-24 bg-brand-light">
      {/* FOUNDER SECTION (Asymmetric) */}
      {founder && (
        <section className="container mx-auto px-6 py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <ScrollReveal direction="right" className="w-full lg:w-5/12">
              <div className="relative aspect-[3/4] w-full">
                <img
                  src={founder.image}
                  alt="Oseremen Emmanuella Ohiku - Founder"
                  className="w-full h-full object-cover rounded-sm shadow-xl" />

                <div className="absolute -bottom-8 -left-8 w-full h-full border border-brand-purple/20 -z-10" />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" className="w-full lg:w-7/12 lg:pl-12">
              <h2 className="text-xs tracking-[0.2em] uppercase text-brand-gray mb-4">
                {founder.label}
              </h2>
              <h1 className="text-4xl md:text-5xl font-serif text-brand-dark mb-2">
                {founder.name}
              </h1>
              <p className="text-sm tracking-widest uppercase text-brand-pink mb-10">
                {founder.role}
              </p>

              <div className="space-y-6 text-brand-gray font-light leading-relaxed">
                {founder.bio1 && <p>{founder.bio1}</p>}
                {founder.bio2 && <p>{founder.bio2}</p>}
                {founder.quote && (
                  <p className="text-xl font-serif text-brand-purple italic pt-4">
                    {founder.quote}
                  </p>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* OUR STORY */}
      {story && (
        <section className="py-24 bg-white mt-12">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <ScrollReveal direction="up">
              <h2 className="text-3xl md:text-4xl font-serif text-brand-dark mb-10">
                {story.title}
              </h2>
              <div className="space-y-6 text-brand-gray font-light leading-relaxed text-left md:text-center">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* OUR PHILOSOPHY */}
      {philosophy && (
        <section className="py-24 bg-brand-light">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <ScrollReveal direction="up">
              <h2 className="text-3xl md:text-4xl font-serif text-brand-dark mb-10">
                {philosophy.title}
              </h2>
              <div className="space-y-6 text-brand-gray font-light leading-relaxed text-left md:text-center">
                {philosophyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* OUR TEAM */}
      {team && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <ScrollReveal direction="up">
              <h2 className="text-3xl md:text-4xl font-serif text-brand-dark mb-6">
                {team.title}
              </h2>
              <p className="text-brand-gray font-light leading-relaxed text-lg">
                {team.description}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* NO CONTENT MESSAGE */}
      {!founder && !story && !philosophy && !team && (
        <div className="container mx-auto px-6 py-24 text-center">
          <p className="text-brand-gray">No content available. Please add content through the admin panel.</p>
        </div>
      )}
    </div>);
}
