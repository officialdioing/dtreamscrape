'use client'

import { BlogEditorPage } from '@/src/admin/pages/BlogEditorPage'
import { useParams } from 'next/navigation'

export default function EditBlogPostRoute() {
  const params = useParams()
  return <BlogEditorPage mode="edit" postId={params.id as string} />
}
