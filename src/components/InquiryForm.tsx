'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollReveal } from './ScrollReveal';

export default function InquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-brand-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl md:text-3xl font-serif text-brand-dark mb-4">
          Thank You!
        </h3>
        <p className="text-brand-gray mb-6">
          We've received your inquiry and will respond within 24-48 hours.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          className="rounded-full px-8 py-3 bg-brand-purple hover:bg-brand-pink text-white">
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* CLIENT DETAILS */}
      <ScrollReveal direction="up">
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Client Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                First Name <span className="text-brand-pink">*</span>
              </label>
              <Input
                name="firstName"
                required
                placeholder="First name"
                className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Last Name <span className="text-brand-pink">*</span>
              </label>
              <Input
                name="lastName"
                required
                placeholder="Last name"
                className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Email Address <span className="text-brand-pink">*</span>
              </label>
              <Input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Phone Number <span className="text-brand-pink">*</span>
              </label>
              <Input
                name="phone"
                type="tel"
                required
                placeholder="+1 (365) 987-9393"
                className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* EVENT DETAILS */}
      <ScrollReveal direction="up" delay={100}>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Event Details
          </h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Event Type <span className="text-brand-pink">*</span>
              </label>
              <select
                name="eventType"
                required
                className="w-full h-12 rounded-full border border-brand-purple/12 bg-white px-5 text-brand-dark focus:outline-none focus:border-brand-purple">
                <option value="">Select event type</option>
                <option value="wedding">Wedding</option>
                <option value="private-social">Private / Social Event</option>
                <option value="corporate-brand">Corporate / Brand Event</option>
                <option value="destination">Destination Experience</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm text-brand-gray">
                  Event Date <span className="text-brand-pink">*</span>
                </label>
                <Input
                  name="eventDate"
                  type="date"
                  required
                  className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-brand-gray">
                  Estimated Guest Count <span className="text-brand-pink">*</span>
                </label>
                <Input
                  name="guestCount"
                  type="number"
                  required
                  placeholder="100"
                  className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Event Location (if known)
              </label>
              <Input
                name="eventLocation"
                placeholder="City, venue, or 'TBD'"
                className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* INVESTMENT RANGE */}
      <ScrollReveal direction="up" delay={200}>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Investment Range
          </h3>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              Please select your estimated budget range <span className="text-brand-pink">*</span>
            </label>
            <select
              name="budget"
              required
              className="w-full h-12 rounded-full border border-brand-purple/12 bg-white px-5 text-brand-dark focus:outline-none focus:border-brand-purple">
              <option value="">Select budget range</option>
              <option value="5000-10000">$5,000 – $10,000</option>
              <option value="10000-20000">$10,000 – $20,000</option>
              <option value="20000-50000">$20,000 – $50,000</option>
              <option value="50000+">$50,000+</option>
            </select>
          </div>
        </div>
      </ScrollReveal>

      {/* VISION & EXPERIENCE */}
      <ScrollReveal direction="up" delay={300}>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Vision & Experience
          </h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                Tell us about your vision for this event
              </label>
              <span className="text-xs text-brand-gray/60 block">
                (Example: theme, style, mood, inspiration, etc.)
              </span>
              <Textarea
                name="vision"
                placeholder="Describe your vision..."
                className="min-h-[120px] rounded-[1.5rem] border-brand-purple/12 bg-white px-5 py-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                What matters most to you for this experience?
              </label>
              <span className="text-xs text-brand-gray/60 block">
                (Example: design, guest experience, budget, organization, etc.)
              </span>
              <Textarea
                name="priorities"
                placeholder="What's most important..."
                className="min-h-[120px] rounded-[1.5rem] border-brand-purple/12 bg-white px-5 py-4"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* DISCOVERY */}
      <ScrollReveal direction="up" delay={400}>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Discovery
          </h3>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              How did you hear about us?
            </label>
            <Input
              name="discovery"
              placeholder="Instagram, referral, Google, etc."
              className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* OPTIONAL FILE UPLOAD */}
      <ScrollReveal direction="up" delay={500}>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-serif text-brand-dark mb-6 pb-2 border-b border-brand-gray/20">
            Optional
          </h3>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              Upload inspiration
            </label>
            <span className="text-xs text-brand-gray/60 block">
              (Pinterest board, mood board, reference images, etc.)
            </span>
            <Input
              name="inspiration"
              type="file"
              accept="image/*,.pdf"
              className="h-12 rounded-full border-brand-purple/12 bg-white px-5"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* SUBMIT BUTTON */}
      <ScrollReveal direction="up" delay={600}>
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto min-h-12 rounded-full px-8 md:px-12 text-sm tracking-[0.14em] uppercase bg-brand-purple hover:bg-brand-pink text-white transition-colors">
            {isSubmitting ? 'Submitting...' : 'Start Your Experience'}
          </Button>
          <p className="text-xs text-brand-gray mt-4 text-center md:text-left">
            We respond to all inquiries within 24–48 hours.
          </p>
        </div>
      </ScrollReveal>
    </form>
  );
}
