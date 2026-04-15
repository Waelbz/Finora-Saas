import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, type PlanType } from '@/lib/stripe'
import { getOrCreateProfile } from '@/lib/actions/profile'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, interval = 'monthly' } = await req.json()

  if (!plan || !PLANS[plan as PlanType]) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const profile = await getOrCreateProfile()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const planConfig = PLANS[plan as PlanType]
  if (!('stripePriceId' in planConfig)) {
    return NextResponse.json({ error: 'Plan gratuit ne nécessite pas de paiement' }, { status: 400 })
  }

  const priceId = planConfig.stripePriceId[interval as 'monthly' | 'yearly']

  // Créer ou récupérer le customer Stripe
  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name || undefined,
      metadata: { clerk_user_id: userId, profile_id: profile.id },
    })
    customerId = customer.id

    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/billing?cancelled=1`,
    metadata: { profile_id: profile.id, plan, interval },
    subscription_data: {
      metadata: { profile_id: profile.id, plan },
    },
    locale: 'fr',
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
