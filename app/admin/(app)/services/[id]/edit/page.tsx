'use client';

import { ServicesEditorPage } from '@/src/admin/pages/ServicesEditorPage';
import { useParams } from 'next/navigation';

export default function EditServicePage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : String((params as any)?.id ?? '');
  return <ServicesEditorPage id={id} />;
}
