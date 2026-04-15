import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/actions/profile'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('audit_reports').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false })
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
  const { data, error } = await admin.from('audit_reports').insert({
    profile_id: profile.id,
    company_id: body.company_id,
    type: body.type || 'general',
    exercice: body.exercice || '2026',
    score: body.score,
    verdict: body.verdict,
    sections: body.sections || [],
    files_analyzed: body.files_analyzed || 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('activity_log').insert({ profile_id: profile.id, company_id: body.company_id, type: 'audit', label: `Audit ${body.exercice} — score ${body.score}/100` })
  return NextResponse.json({ data }, { status: 201 })
}
