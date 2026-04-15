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

  if (!profile) {
    // Log l'erreur pour debug
    console.error('Profile not found for userId:', userId)
    return (
      <div style={{color:'white',background:'#0f1117',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px',fontFamily:'monospace'}}>
        <h1>Erreur de connexion Supabase</h1>
        <p>userId: {userId}</p>
        <p>Vérifiez SUPABASE_SERVICE_ROLE_KEY dans Vercel</p>
        <a href="/sign-in" style={{color:'#6c47ff'}}>Retour connexion</a>
      </div>
    )
  }

  return (
    <DashboardShell profile={profile} companies={companies}>
      {children}
    </DashboardShell>
  )
}
