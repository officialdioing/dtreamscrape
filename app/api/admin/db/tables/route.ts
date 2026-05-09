import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase-admin'
import { protectAdminRoute } from '@/src/lib/server-auth'

export async function GET(request: NextRequest) {
  const errorResponse = await protectAdminRoute()
  if (errorResponse) return errorResponse

  const includeColumns =
    request.nextUrl.searchParams.get('includeColumns') === '1'

  const { data: tables, error: tablesError } = await supabaseAdmin()
    .schema('information_schema')
    .from('tables')
    .select('table_name,table_schema,table_type')
    .eq('table_schema', 'public')
    .order('table_name', { ascending: true })

  if (tablesError) {
    return NextResponse.json({ error: tablesError.message }, { status: 500 })
  }

  if (!includeColumns) {
    return NextResponse.json({ tables: tables ?? [] })
  }

  const { data: columns, error: columnsError } = await supabaseAdmin()
    .schema('information_schema')
    .from('columns')
    .select(
      'table_name,column_name,data_type,is_nullable,ordinal_position,column_default'
    )
    .eq('table_schema', 'public')
    .order('table_name', { ascending: true })
    .order('ordinal_position', { ascending: true })

  if (columnsError) {
    return NextResponse.json({ error: columnsError.message }, { status: 500 })
  }

  const byTable: Record<string, any[]> = {}
  for (const c of columns ?? []) {
    const name = (c as any).table_name as string
    byTable[name] ||= []
    byTable[name].push(c)
  }

  return NextResponse.json({
    tables: tables ?? [],
    columnsByTable: byTable,
  })
}

