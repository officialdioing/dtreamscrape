/**
 * Performance Optimization Utilities
 *
 * This file contains utilities for optimizing application performance
 * including dynamic imports, lazy loading, and bundle analysis.
 */

import { CACHE_DURATION } from './cache';

/**
 * Dynamic import wrapper with loading and error states
 */
export function dynamicComponent<T>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: React.ComponentType;
    error?: React.ComponentType<{ error: Error }>;
    ssr?: boolean;
  }
) {
  return {
    default: importFn,
    ...options,
  };
}

/**
 * Lazy load components with prefetch on hover
 */
export function lazyWithPreload<T>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> & { preload: () => void } {
  const component = React.lazy(importFn);
  (component as any).preload = importFn;
  return component as any;
}

/**
 * Debounce function for search and other input handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll and resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Intersection observer for lazy loading images and components
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
}

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Generate responsive image sizes
   */
  getSizes: (breakpoints: number[]) => {
    return breakpoints
      .map((bp) => `(max-width: ${bp}px) ${bp}px`)
      .join(', ') + `, ${breakpoints[breakpoints.length - 1]}px`;
  },

  /**
   * Generate srcset for responsive images
   */
  getSrcSet: (baseUrl: string, sizes: number[]) => {
    return sizes
      .map((size) => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  },

  /**
   * Calculate optimal image quality based on device
   */
  getQuality: () => {
    if (typeof window === 'undefined') return 75;

    const isSlowConnection = navigator.connection?.effectiveType === 'slow-2g' ||
      navigator.connection?.effectiveType === '2g';

    return isSlowConnection ? 60 : 75;
  },
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Measure component render time
   */
  measureRender: (componentName: string, fn: () => void) => {
    if (typeof window === 'undefined' || !performance.mark) {
      return fn();
    }

    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-render`;

    performance.mark(startMark);
    fn();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    console.debug(`${componentName} rendered in ${measure.duration.toFixed(2)}ms`);

    // Cleanup
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  },

  /**
   * Log web vitals
   */
  logWebVital: (metric: { name: string; value: number }) => {
    console.debug(`[Web Vitals] ${metric.name}:`, metric.value);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        non_interaction: true,
      });
    }
  },
};

/**
 * Resource prefetching utilities
 */
export const resourcePrefetch = {
  /**
   * Prefetch a page
   */
  prefetchPage: (url: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  },

  /**
   * Prefetch an image
   */
  prefetchImage: (url: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  },

  /**
   * Prefetch on hover
   */
  prefetchOnHover: (element: HTMLElement, url: string) => {
    let prefetchTimeout: NodeJS.Timeout;

    element.addEventListener('mouseenter', () => {
      prefetchTimeout = setTimeout(() => {
        resourcePrefetch.prefetchPage(url);
      }, 100);
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(prefetchTimeout);
    });
  },
};

/**
 * Memory optimization utilities
 */
export const memoryOptimization = {
  /**
   * Cleanup event listeners
   */
  cleanupListeners: (listeners: Array<{ element: any; event: string; handler: any }>) => {
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
  },

  /**
   * Cleanup timeouts and intervals
   */
  cleanupTimers: (timers: Array<NodeJS.Timeout | number>) => {
    timers.forEach((timer) => {
      clearTimeout(timer as NodeJS.Timeout);
      clearInterval(timer as NodeJS.Timeout);
    });
  },

  /**
   * Clear large objects from memory
   */
  clearLargeObjects: (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        delete obj[key];
      });
    }
  },
};

/**
 * Code splitting utilities
 */
export const codeSplitting = {
  /**
   * Split routes into chunks
   */
  splitRoute: (route: string) => {
    return () => import(`../app/${route}/page`);
  },

  /**
   * Split admin routes
   */
  splitAdminRoute: (route: string) => {
    return () => import(`../app/admin/(app)/${route}/page`);
  },
};

/**
 * Cache utilities for client-side caching
 */
export const clientCache = {
  /**
   * Create a simple cache with TTL
   */
  create: <T>(ttl: number = CACHE_DURATION.STATIC * 1000) => {
    const cache = new Map<string, { data: T; expiry: number }>();

    return {
      get: (key: string): T | null => {
        const entry = cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
          cache.delete(key);
          return null;
        }

        return entry.data;
      },

      set: (key: string, data: T): void => {
        cache.set(key, {
          data,
          expiry: Date.now() + ttl,
        });
      },

      clear: (): void => {
        cache.clear();
      },

      has: (key: string): boolean => {
        const entry = cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiry) {
          cache.delete(key);
          return false;
        }

        return true;
      },
    };
  },
};

/**
 * Service worker registration for PWA capabilities
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.debug('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.debug('Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Font optimization utilities
 */
export const fontOptimization = {
  /**
   * Preload critical fonts
   */
  preloadFont: (url: string, as: 'font' = 'font', type: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.type = type;
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  },

  /**
   * Use font-display: swap for non-critical fonts
   */
  getFontDisplay: (critical: boolean = false) => {
    return critical ? 'block' : 'swap';
  },
};

// Type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

import React from 'react';
