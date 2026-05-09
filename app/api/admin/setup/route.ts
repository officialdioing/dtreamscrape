/**
 * Initial setup endpoint for creating the first admin user
 * This endpoint is only functional if no users exist in the database
 * Run this once during initial setup, then disable/remove it
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/src/lib/password'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check if any users already exist
    const { data: existingUsers, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking existing users:', countError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // If users exist, don't allow setup (security measure)
    if (existingUsers && existingUsers > 0) {
      return NextResponse.json(
        {
          error: 'Setup already completed. Users already exist.',
          hint: 'Use the admin interface to manage users.'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create admin user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        role: 'super_admin',
        email_verified: true,
        is_active: true,
        failed_login_attempts: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin user:', error)
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/setup
 * Check if setup is needed
 */
export async function GET() {
  try {
    const { data: existingUsers, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const needsSetup = !existingUsers || existingUsers === 0

    return NextResponse.json({
      needsSetup,
      userCount: existingUsers || 0,
    })
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json(
      { error: 'Setup check failed' },
      { status: 500 }
    )
  }
}
