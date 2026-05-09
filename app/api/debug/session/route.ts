import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/src/lib/golang-auth'

export async function GET(request: NextRequest) {
  const session = await getSession()

  return NextResponse.json({
    hasSession: !!session,
    session: session
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: `${session.user.first_name} ${session.user.last_name}`,
            role: session.user.role,
          },
          expires: session.expires_at,
        }
      : null,
    cookies: request.headers.get('cookie')?.substring(0, 200),
  })
}
