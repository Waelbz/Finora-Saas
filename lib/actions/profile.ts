'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export async function getOrCreateProfile(): Promise<Profile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const admin = createAdminClient()

  // Vérifier si le profil existe
  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (existing) return existing as Profile

  // Créer le profil
  const user = await currentUser()
  if (!user) return null

  const { data: created, error } = await admin
    .from('profiles')
    .insert({
      clerk_user_id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatar_url: user.imageUrl,
      plan: 'free',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return created as Profile
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const admin = createAdminClient()

  const { data: updated, error } = await admin
    .from('profiles')
    .update(data)
    .eq('clerk_user_id', userId)
    .select()
    .single()

  if (error) return null
  return updated as Profile
}

export async function saveApiKey(encryptedKey: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ anthropic_api_key_encrypted: encryptedKey })
    .eq('clerk_user_id', userId)

  return !error
}

export async function updateGlobalCfg(cfg: Profile['global_cfg']): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ global_cfg: cfg })
    .eq('clerk_user_id', userId)

  return !error
}
