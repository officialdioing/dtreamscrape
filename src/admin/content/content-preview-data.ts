import 'server-only'

import { getSiteContentPageCached } from '@/src/lib/backend-content'
import { getPublishedServicesCached } from '@/src/lib/backend-services'

type GroupedContent = Record<string, Record<string, { id: string; display_order: number; value: any }>>

function sectionEntries(grouped: GroupedContent, page: string) {
  return Object.entries(grouped)
    .filter(([key]) => key.startsWith(`${page}_`))
    .map(([key, items]) => {
      const section = key.slice(page.length + 1)
      const entries = Object.values(items || {})
      const ordered = entries.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      return {
        id: section,
        label: section.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        description: 'Edit this section of the public page.',
        firstItemId: ordered[0]?.id || '',
        count: ordered.length,
      }
    })
}

export async function getAdminPreviewData(page: string) {
  const result: any = {
    component: null as any,
    props: {},
    sections: [] as Array<{ id: string; firstItemId: string; count: number }>,
  }

  switch (page) {
    case 'home': {
      const { grouped } = await getSiteContentPageCached('home')
      result.component = (await import('@/src/components/pages/HomePage')).default
      result.props = { initialGrouped: grouped }
      result.sections = sectionEntries(grouped, 'home')
      return result
    }
    case 'about': {
      const { grouped } = await getSiteContentPageCached('about')
      const comp = (await import('@/src/components/pages/AboutPage')).default
      result.component = comp
      result.props = {
        initialFounder: grouped.about_founder
          ? {
              label: grouped.about_founder.label?.value || '',
              name: grouped.about_founder.name?.value || '',
              role: grouped.about_founder.role?.value || '',
              bio1: grouped.about_founder.bio1?.value || '',
              bio2: grouped.about_founder.bio2?.value || '',
              quote: grouped.about_founder.quote?.value || '',
              image: grouped.about_founder.image?.value || '',
            }
          : undefined,
        initialStory: grouped.about_story
          ? {
              title: grouped.about_story.title?.value || '',
              content: grouped.about_story.content?.value || '',
            }
          : undefined,
        initialPhilosophy: grouped.about_philosophy
          ? {
              title: grouped.about_philosophy.title?.value || '',
              content: grouped.about_philosophy.content?.value || '',
            }
          : undefined,
        initialTeam: grouped.about_team
          ? {
              title: grouped.about_team.title?.value || '',
              description: grouped.about_team.description?.value || '',
            }
          : undefined,
      }
      result.sections = sectionEntries(grouped, 'about')
      return result
    }
    case 'services': {
      const services = await getPublishedServicesCached()
      result.component = (await import('@/src/components/pages/ServicesPage')).default
      result.props = { initialServices: services }
      result.sections = services.map((service: any) => ({
        id: service.slug || service.id,
        label: service.title || service.category || 'Service',
        description: service.description || 'Edit this service entry.',
        firstItemId: service.id,
        count: 1,
      }))
      return result
    }
    case 'contact': {
      const { grouped } = await getSiteContentPageCached('contact')
      const comp = (await import('@/src/components/pages/ContactPage')).ContactPage
      result.component = comp
      result.props = {
        initialCards: grouped.contact_contact_info?.cards?.value || undefined,
      }
      result.sections = sectionEntries(grouped, 'contact')
      return result
    }
    case 'love_notes': {
      const { grouped } = await getSiteContentPageCached('love_notes')
      const comp = (await import('@/src/components/pages/LoveNotesPage')).LoveNotesPage
      result.component = comp
      result.props = {
        initialTestimonials: grouped.love_notes_testimonials?.items?.value || undefined,
      }
      result.sections = sectionEntries(grouped, 'love_notes')
      return result
    }
    case 'consultation': {
      const { grouped } = await getSiteContentPageCached('consultation')
      const comp = (await import('@/src/components/pages/ConsultationPage')).ConsultationPage
      result.component = comp
      result.props = {
        initialEventTypeOptions: grouped.consultation_event_types?.options?.value || undefined,
        initialConsultationContent: grouped.consultation_consultation_types?.types?.value || undefined,
      }
      result.sections = sectionEntries(grouped, 'consultation')
      return result
    }
    case 'consultation_editorial': {
      const comp = (await import('@/src/components/pages/ConsultationEditorialPage')).default
      result.component = comp
      result.props = {}
      return result
    }
    default:
      return result
  }
}
