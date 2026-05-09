import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag, "max");
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        tag
      });
    }

    // Revalidate by path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        path
      });
    }

    return NextResponse.json({
      revalidated: false,
      now: Date.now(),
      message: 'Missing tag or path parameter'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Revalidation error:', error);
    return NextResponse.json({
      revalidated: false,
      message: error.message
    }, { status: 500 });
  }
}
