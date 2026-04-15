'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from './profile'
import type { Company } from '@/types'
import { z } from 'zod'

const CompanySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  siren: z.string().regex(/^[0-9]{9}$/, 'SIREN invalide (9 chiffres)').optional().or(z.literal('')),
  dossier: z.string().max(8).optional(),
  exercice: z.string().default('2026'),
  type: z.string().optional(),
  color: z.string().default('#6c47ff'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
})

export async function getCompanies(): Promise<Company[]> {
  const profile = await getOrCreateProfile()
  if (!profile) return []

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Company[]
}

export async function getCompany(id: string): Promise<Company | null> {
  const profile = await getOrCreateProfile()
  if (!profile) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (error) return null
  return data as Company
}

export async function createCompany(formData: FormData | Record<string, unknown>): Promise<{ data?: Company; error?: string }> {
  const profile = await getOrCreateProfile()
  if (!profile) return { error: 'Non authentifié' }

  const raw = formData instanceof FormData ? Object.fromEntries(formData) : formData
  const parsed = CompanySchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Données invalides' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .insert({
      ...parsed.data,
      profile_id: profile.id,
      dossier: parsed.data.dossier || parsed.data.name.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, ''),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as Company }
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<{ data?: Company; error?: string }> {
  const profile = await getOrCreateProfile()
  if (!profile) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', profile.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as Company }
}

export async function deleteCompany(id: string): Promise<{ error?: string }> {
  const profile = await getOrCreateProfile()
  if (!profile) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('companies')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id)

  if (error) return { error: error.message }
  return {}
}

export async function updateCompanyStats(
  companyId: string,
  field: keyof Company['stats'],
  increment: number = 1
): Promise<void> {
  const admin = createAdminClient()

  const { data: company } = await admin
    .from('companies')
    .select('stats')
    .eq('id', companyId)
    .single()

  if (!company) return

  const stats = (company.stats as Company['stats']) || { invoices: 0, releves: 0, bulletins: 0, immobilisations: 0 }
  stats[field] = (stats[field] || 0) + increment

  await admin.from('companies').update({ stats }).eq('id', companyId)
}
