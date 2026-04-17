// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { plan } = body

    // Choisir le bon Price ID selon le plan
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID non configuré pour ' + plan }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://finoracomptabilite.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: appUrl + '/dashboard?success=true',
      cancel_url: appUrl + '/billing?canceled=true',
      client_reference_id: userId,
      metadata: { userId, plan },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du checkout' },
      { status: 500 }
    )
  }
}
