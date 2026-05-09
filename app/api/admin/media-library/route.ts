import { NextRequest, NextResponse } from 'next/server';
import {
  listMedia,
  uploadFile,
  MediaItem,
} from '@/src/lib/supabase-storage-admin';
import { protectAdminRoute } from '@/src/lib/server-auth';

export async function GET() {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  try {
    const { data: items, error } = await listMedia();

    if (error) {
      console.error('❌ Error listing media:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('❌ Error listing media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list media' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await uploadFile(file);

    if (uploadError || !uploadData) {
      console.error('❌ Error uploading file:', uploadError);
      return NextResponse.json(
        { error: uploadError?.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Return the media item
    const item: MediaItem = {
      id: uploadData.path,
      name: uploadData.fileName,
      url: uploadData.url,
      path: uploadData.path,
      type: uploadData.contentType.startsWith('image/') ? 'image' : 'file',
      mime_type: uploadData.contentType,
      size: uploadData.size < 1024
        ? `${uploadData.size} B`
        : uploadData.size < 1024 * 1024
        ? `${(uploadData.size / 1024).toFixed(1)} KB`
        : `${(uploadData.size / (1024 * 1024)).toFixed(1)} MB`,
      size_bytes: uploadData.size,
      created_at: new Date().toISOString(),
      folder: 'media',
    };

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

