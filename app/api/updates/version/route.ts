import { NextRequest, NextResponse } from 'next/server';
import { bumpContentVersion, getContentVersion } from '@/src/lib/content-version';

export async function GET(request: NextRequest) {
  return NextResponse.json({ version: getContentVersion() });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ version: bumpContentVersion() });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Content updated:', body);

    return NextResponse.json({ success: true, version: bumpContentVersion() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update version' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('Content deleted:', body);

    return NextResponse.json({ success: true, version: bumpContentVersion() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update version' }, { status: 500 });
  }
}
