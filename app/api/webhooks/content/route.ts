import { NextRequest, NextResponse } from 'next/server';
import { bumpContentVersion } from '@/src/lib/content-version';

async function handleMutation(request: NextRequest, action: 'create' | 'update' | 'delete') {
  try {
    const body = await request.json().catch(() => ({}));
    const version = bumpContentVersion();

    return NextResponse.json({
      success: true,
      version,
      action,
      resource: typeof body?.resource === 'string' ? body.resource : 'content',
      timestamp: body?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process content webhook' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleMutation(request, 'create');
}

export async function PUT(request: NextRequest) {
  return handleMutation(request, 'update');
}

export async function DELETE(request: NextRequest) {
  return handleMutation(request, 'delete');
}
