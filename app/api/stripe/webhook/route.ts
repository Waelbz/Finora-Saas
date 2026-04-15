import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  const admin = createAdminClient()
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Record<string, any>
      const profileId = session.metadata?.profile_id
      const plan = session.metadata?.plan
      if (profileId && plan) {
        await admin.from('profiles').update({ plan, stripe_subscription_id: session.subscription, subscription_status: 'active' }).eq('id', profileId)
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Record<string, any>
      const profileId = sub.metadata?.profile_id
      if (profileId) {
        await admin.from('profiles').update({ plan: sub.metadata?.plan || 'free', subscription_status: sub.status }).eq('id', profileId)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Record<string, any>
      const profileId = sub.metadata?.profile_id
      if (profileId) {
        await admin.from('profiles').update({ plan: 'free', subscription_status: 'cancelled', stripe_subscription_id: null }).eq('id', profileId)
      }
      break
    }
  }
  return NextResponse.json({ received: true })
}
