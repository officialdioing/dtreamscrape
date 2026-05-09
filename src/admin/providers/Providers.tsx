'use client'

import React from 'react'
import { GolangAuthProvider } from './GolangAuthProvider'
import { BlogPostsProvider } from './BlogPostsProvider'
import { EventsProvider } from './EventsProvider'
import { ServicesProvider } from './ServicesProvider'
import { InquiriesProvider } from './InquiriesProvider'
import { MediaProvider } from './MediaProvider'
import { SiteContentProvider } from './SiteContentProvider'
import { SettingsProvider } from './SettingsProvider'
import { ToastProvider } from '@/src/admin/toast/ToastProvider'
import { SuppressHydrationWarnings } from '../components/SuppressHydration'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SuppressHydrationWarnings>
      <div suppressHydrationWarning>
        <ToastProvider>
          <GolangAuthProvider>
            <BlogPostsProvider>
              <EventsProvider>
                <ServicesProvider>
                  <InquiriesProvider>
                    <MediaProvider>
                      <SiteContentProvider>
                        <SettingsProvider>{children}</SettingsProvider>
                      </SiteContentProvider>
                    </MediaProvider>
                  </InquiriesProvider>
                </ServicesProvider>
              </EventsProvider>
            </BlogPostsProvider>
          </GolangAuthProvider>
        </ToastProvider>
      </div>
    </SuppressHydrationWarnings>
  )
}
