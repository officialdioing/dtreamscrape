'use client'

import * as React from 'react'
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useBlogPosts } from '../providers/BlogPostsProvider'
import { formatAdminDate } from '@/src/admin/utils/formatDate'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared'
import { Badge } from '@/components/ui/badge'

export function BlogManagementPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'published' | 'draft'>('all')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const { toast } = useToast()
  const router = useRouter()
  const { posts, isLoading, error, refresh, deletePost } = useBlogPosts()

  const handleDelete = async (id: string, title: string) => {
    try {
      await deletePost(id)
      toast({ title: 'Post deleted', variant: 'success', duration: 2500 })
      void refresh()
    } catch (error) {
      toast({
        title: 'Failed to delete post',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    }
  }

  const handleBulkDelete = async (selectedPosts: any[]) => {
    if (!window.confirm(`Are you sure you want to delete ${selectedPosts.length} ${selectedPosts.length === 1 ? 'post' : 'posts'}?`)) {
      return
    }

    try {
      await Promise.all(selectedPosts.map(post => deletePost(post.id)))
      toast({
        title: `${selectedPosts.length} ${selectedPosts.length === 1 ? 'post' : 'posts'} deleted`,
        variant: 'success',
        duration: 2500
      })
      setSelectedIds(new Set())
      void refresh()
    } catch (error) {
      toast({
        title: 'Failed to delete posts',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refresh()
      toast({ title: 'Refreshed', variant: 'success', duration: 1500 })
    } catch (error) {
      toast({
        title: 'Failed to refresh',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const filteredPosts = posts
    .filter((post) => {
      const status = post.__raw?.status === 'published' ? 'published' : 'draft'
      if (filterStatus === 'published') return status === 'published'
      if (filterStatus === 'draft') return status === 'draft'
      return true
    })
    .filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.__raw?.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (post: any) => (
        <div>
          <div className="font-medium text-foreground">{post.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">/{post.__raw?.slug}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (post: any) => <StatusBadge status={post.__raw?.status || 'draft'} />,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (post: any) =>
        post.category ? (
          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100">
            {post.category}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (post: any) => formatAdminDate(post.__raw?.created_at),
    },
  ]

  const emptyMessage = searchQuery || filterStatus !== 'all'
    ? 'No posts match your filters.'
    : 'No blog posts yet. Create your first post!'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-serif text-2xl font-semibold text-foreground">
            Blog Posts
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Manage your blog content
            {!error && (
              <span className="ml-2 text-muted-foreground/70">
                ({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/admin/blog/new')}>
            <Plus size={16} />
            New Post
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <span>⚠️ {error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search posts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filteredPosts}
        columns={columns}
        keyExtractor={(post) => post.id}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(post) => router.push(`/admin/blog/${post.__raw?.id || post.id}/edit`)}
        bulkActions={(selectedPosts) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkDelete(selectedPosts)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete {selectedPosts.length} {selectedPosts.length === 1 ? 'post' : 'posts'}
          </Button>
        )}
        emptyMessage={emptyMessage}
        loadingMessage="Loading posts…"
      />
    </div>
  )
}
