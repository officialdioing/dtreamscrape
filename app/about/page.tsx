import AboutPage from '@/src/components/pages/AboutPage';
import { getSiteContentPageCached } from '@/src/lib/backend-content';

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { grouped } = await getSiteContentPageCached('about');

  const founder = grouped.about_founder;
  const story = grouped.about_story;
  const philosophy = grouped.about_philosophy;
  const team = grouped.about_team;

  const initialFounder = founder ? {
    label: founder.label?.value || '',
    name: founder.name?.value || '',
    role: founder.role?.value || '',
    bio1: founder.bio1?.value || '',
    bio2: founder.bio2?.value || '',
    quote: founder.quote?.value || '',
    image: founder.image?.value || ''
  } : undefined;

  const initialStory = story ? {
    title: story.title?.value || '',
    content: story.content?.value || ''
  } : undefined;

  const initialPhilosophy = philosophy ? {
    title: philosophy.title?.value || '',
    content: philosophy.content?.value || ''
  } : undefined;

  const initialTeam = team ? {
    title: team.title?.value || '',
    description: team.description?.value || ''
  } : undefined;

  return (
    <AboutPage
      initialFounder={initialFounder}
      initialStory={initialStory}
      initialPhilosophy={initialPhilosophy}
      initialTeam={initialTeam}
    />
  );
}
