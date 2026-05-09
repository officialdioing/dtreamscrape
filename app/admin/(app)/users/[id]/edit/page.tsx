'use client'

import { UsersEditorPage } from '@/src/admin/pages/UsersEditorPage'
import { useParams } from 'next/navigation'

export default function EditUserPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : String((params as any)?.id ?? '')
  return <UsersEditorPage id={id} />
}
