// @ts-nocheck
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/actions/profile'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  const admin = createAdminClient()
  let q = admin.from('bank_statements').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false })
  if (companyId) q = q.eq('company_id', companyId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('bank_statements').insert({
    profile_id: profile.id,
    company_id: body.company_id,
    filename: body.filename,
    bank_name: body.bank_name,
    period: body.period,
    journal: body.journal || 'BNQ',
    operations: body.operations,
    arf_lines: body.arf_lines,
    total_debit: body.total_debit || 0,
    total_credit: body.total_credit || 0,
    status: 'processed',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('activity_log').insert({
    profile_id: profile.id,
    company_id: body.company_id,
    type: 'bank',
    label: `Relevé ${body.bank_name || body.filename}`,
  })
  return NextResponse.json({ data }, { status: 201 })
}
