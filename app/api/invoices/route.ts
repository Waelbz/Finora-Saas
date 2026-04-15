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
  let query = admin
    .from('invoices')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { company_id, filename, type, supplier, amount_ht, tva, amount_ttc,
          date_invoice, journal, arf_lines, fec_lines, raw_analysis } = body

  if (!company_id || !filename) {
    return NextResponse.json({ error: 'company_id et filename requis' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Sauvegarder l'écriture
  const { data, error } = await admin
    .from('invoices')
    .insert({
      profile_id: profile.id,
      company_id,
      filename,
      type: type || 'achat',
      supplier,
      amount_ht,
      tva,
      amount_ttc,
      date_invoice,
      journal: journal || 'HA',
      arf_lines,
      fec_lines,
      raw_analysis,
      status: 'processed',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Incrémenter les stats de la société
  await admin.rpc('increment_company_stat', {
    p_company_id: company_id,
    p_field: 'invoices',
    p_increment: 1,
  }).catch(() => {}) // Non bloquant

  // Ajouter à l'activité
  await admin.from('activity_log').insert({
    profile_id: profile.id,
    company_id,
    type: 'invoice',
    label: `Facture ${supplier || filename}`,
    amount: amount_ttc ? `${amount_ttc} €` : undefined,
  })

  return NextResponse.json({ data }, { status: 201 })
}
