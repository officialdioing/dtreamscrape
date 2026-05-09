import { NextRequest, NextResponse } from 'next/server';
import { moveFile, deleteFile, listMedia, MediaItem } from '@/src/lib/supabase-storage-admin';
import { protectAdminRoute } from '@/src/lib/server-auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  try {
    const { id } = await params;
    const body = await request.json();
    const oldPath = id;
    const newName = body.name || oldPath;

    // If renaming, move the file
    if (oldPath !== newName) {
      const { error } = await moveFile(oldPath, newName);

      if (error) {
        console.error('❌ Error renaming media:', error);
        return NextResponse.json({ error }, { status: 500 });
      }
    }

    // Get the updated file info
    const { data: items } = await listMedia();
    const item = items?.find(i => i.id === newName);

    if (!item) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('❌ Error updating media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update media' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  try {
    const { id } = await params;
    const path = id;

    // Delete the file from Supabase Storage
    const { error } = await deleteFile(path);

    if (error) {
      console.error('❌ Error deleting media:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('❌ Error deleting media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete media' },
      { status: 500 }
    );
  }
}

