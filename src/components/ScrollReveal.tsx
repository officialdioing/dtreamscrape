'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 800,
  className = '',
  threshold = 0.1
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let lastScrollTop = 0;
    let scrollDirection: 'up' | 'down' = 'down';

    // Check initial visibility on mount
    const checkInitialVisibility = () => {
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (isInViewport && !hasAnimated) {
        setIsVisible(true);
        setHasAnimated(true);
      }
    };

    checkInitialVisibility();

    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Determine scroll direction
      if (currentScrollTop > lastScrollTop) {
        scrollDirection = 'down';
      } else {
        scrollDirection = 'up';
      }
      lastScrollTop = currentScrollTop;

      // Check if element is in viewport
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (scrollDirection === 'down' && isInViewport && !hasAnimated) {
        // Scrolling down and element enters viewport
        setIsVisible(true);
        setHasAnimated(true);
      } else if (scrollDirection === 'up' && isInViewport) {
        // Scrolling up - always show animation
        setIsVisible(true);
        setHasAnimated(false);
      } else if (scrollDirection === 'up' && !isInViewport && hasAnimated) {
        // Scrolling up and element leaves viewport - reset for re-animation
        setIsVisible(false);
        setHasAnimated(false);
      }
    };

    // Throttled scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [hasAnimated, threshold]);

  const getTransform = () => {
    if (isVisible) {
      return 'translate3d(0, 0, 0)';
    }

    switch (direction) {
      case 'up':
        return 'translate3d(0, 60px, 0)';
      case 'down':
        return 'translate3d(0, -60px, 0)';
      case 'left':
        return 'translate3d(60px, 0, 0)';
      case 'right':
        return 'translate3d(-60px, 0, 0)';
      default:
        return 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}
