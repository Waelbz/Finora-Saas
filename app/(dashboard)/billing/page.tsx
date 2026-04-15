import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateProfile } from '@/lib/actions/profile'
import { PLANS } from '@/lib/stripe'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await getOrCreateProfile()
  if (!profile) redirect('/sign-in')

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4">
        <h1 className="text-white font-bold text-lg font-display">Abonnement</h1>
        <p className="text-white/40 text-sm mt-0.5">Gérez votre plan et votre facturation</p>
      </div>

      <div className="p-8 max-w-4xl">
        {/* Plan actuel */}
        <div className="card card-body mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#858aaa] font-mono uppercase tracking-wide mb-1">Plan actuel</div>
            <div className="text-2xl font-extrabold font-display text-[#0f1117] capitalize">{profile.plan}</div>
            <div className="text-sm text-[#858aaa] mt-1">
              {profile.subscription_status === 'active' ? '✓ Abonnement actif' : 'Plan gratuit'}
            </div>
          </div>
          {profile.plan !== 'free' && (
            <a
              href="https://billing.stripe.com/p/login/test_xxxxx"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Gérer l'abonnement →
            </a>
          )}
        </div>

        <BillingClient currentPlan={profile.plan} />
      </div>
    </div>
  )
}
