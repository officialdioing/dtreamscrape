'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from './ui/sheet';

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasImageHero =
    pathname === '/' ||
    pathname.startsWith('/portfolio') ||
    pathname === '/love-notes' ||
    pathname === '/consultation-editorial';
  const useLightNav = hasImageHero && !isScrolled;

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navItems = [
  {
    href: '/',
    label: 'Home'
  },
  {
    href: '/about',
    label: 'About'
  },
  {
    href: '/services',
    label: 'Services'
  },
  {
    href: '/portfolio',
    label: 'Blog'
  },
  {
    href: '/contact',
    label: 'Contact'
  }];

  const isActive = (href: string) => {
    if (href === '/portfolio') {
      return pathname.startsWith('/portfolio');
    }

    return pathname === href;
  };

  const isConsultationActive =
    pathname === '/consultation-editorial' || pathname === '/consultation';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-nav py-3 md:py-4' : 'bg-transparent py-4 md:py-6'}`}>
      
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center flex-shrink-0">
          <div
            className={`relative h-10 w-28 xs:h-11 xs:w-30 sm:h-14 sm:w-40 md:h-16 md:w-52 transition-all duration-500 ${
              useLightNav
                ? 'scale-[1.02] drop-shadow-[0_12px_30px_rgba(255,255,255,0.28)]'
                : 'drop-shadow-none'
            }`}>
            {useLightNav && (
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.18),transparent_44%)] blur-xl" />
            )}
            <Image
              src="/logo.png"
              alt="Dreamscape Curated Events"
              fill
              sizes="(min-width: 640px) 160px, (min-width: 768px) 208px, 112px"
              priority
              className="object-contain object-left relative z-10"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) =>
          <Link
            key={item.href}
            href={item.href}
            className={`relative inline-flex items-center justify-center pb-3 text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
              isActive(item.href)
                ? useLightNav
                  ? 'text-white'
                  : 'text-brand-dark'
                : useLightNav
                  ? 'text-white/90 hover:text-white'
                  : 'text-brand-dark hover:text-brand-pink'
            }`}>
              {item.label}
              <span
                className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-brand-pink transition-all duration-300 ${
                  isActive(item.href) ? 'w-6 opacity-100' : 'w-0 opacity-0'
                }`}
              />
            </Link>
          )}
        </nav>

        {/* CTA & Mobile Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/consultation-editorial">
            <Button
              className={`hidden md:inline-flex rounded-full px-4 sm:px-6 py-2 text-xs tracking-wider uppercase transition-all ${
                isConsultationActive
                  ? 'bg-brand-pink text-white shadow-[0_10px_30px_rgba(198,100,147,0.28)]'
                  : useLightNav
                    ? 'bg-white text-brand-purple hover:bg-white/90'
                    : 'bg-brand-purple hover:bg-brand-pink text-white'
              }`}>

              <span className="hidden sm:inline">Book a Consultation</span>
              <span className="sm:hidden">Consultation</span>
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              className={`md:hidden group relative min-h-12 min-w-12 rounded-full p-2.5 transition-all duration-300 ${
                useLightNav
                  ? 'text-white hover:bg-white/10'
                  : 'text-brand-dark hover:bg-brand-purple/10'
              }`}
              aria-label="Open menu">

              <Menu className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] sm:w-[400px] bg-white border-l border-brand-gray/10 overflow-y-auto">

              <SheetClose
                className="absolute top-4 right-4 z-10 rounded-full p-2.5 transition-all duration-300 hover:bg-brand-purple/10 text-brand-dark hover:text-brand-purple"
                aria-label="Close menu">

                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>

              <nav className="flex flex-col justify-center h-full px-6 py-12 space-y-6 sm:space-y-7">
                {navItems.map((item) =>
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={`text-2xl sm:text-[1.75rem] leading-tight font-serif text-left transition-all duration-300 py-2 relative group ${
                        isActive(item.href)
                          ? 'text-brand-pink'
                          : 'text-brand-dark hover:text-brand-purple'
                      }`}>

                      {item.label}
                      <span className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-brand-pink to-brand-purple transition-all duration-300 ${
                        isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`} />
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>);

}
