// @ts-nocheck
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/actions/profile'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const { name, siren, dossier, exercice, type, color, address, city, postal_code, email, phone } = body

  if (!name) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
  if (siren && !/^[0-9]{9}$/.test(siren)) {
    return NextResponse.json({ error: 'SIREN invalide (9 chiffres)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .insert({
      profile_id: profile.id,
      name,
      siren: siren || null,
      dossier: dossier || name.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, ''),
      exercice: exercice || '2026',
      type: type || 'sarl',
      color: color || '#6c47ff',
      address, city, postal_code, email, phone,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
