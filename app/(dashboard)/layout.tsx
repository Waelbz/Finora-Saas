import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateProfile } from '@/lib/actions/profile'
import { getCompanies } from '@/lib/actions/companies'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [profile, companies] = await Promise.all([
    getOrCreateProfile(),
    getCompanies(),
  ])

  if (!profile) redirect('/sign-in')

  return (
    <DashboardShell profile={profile} companies={companies}>
      {children}
    </DashboardShell>
  )
}
