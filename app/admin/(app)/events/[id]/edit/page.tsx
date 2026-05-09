'use client';

import { EventsEditorPage } from '@/src/admin/pages/EventsEditorPage';
import { useParams } from 'next/navigation';

export default function EditEventPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : String((params as any)?.id ?? '');
  return <EventsEditorPage id={id} />;
}
