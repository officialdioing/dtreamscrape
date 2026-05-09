'use client'

import { InquiriesEditorPage } from '@/src/admin/pages/InquiriesEditorPage'
import { useParams } from 'next/navigation'

export default function EditInquiryPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : String((params as any)?.id ?? '')
  return <InquiriesEditorPage id={id} />
}
