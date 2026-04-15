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
  let q = admin.from('immobilisations').select('*').eq('profile_id', profile.id).eq('active', true).order('created_at', { ascending: false })
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
  if (!body.nom || !body.valeur) return NextResponse.json({ error: 'nom et valeur requis' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('immobilisations').insert({ ...body, profile_id: profile.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
