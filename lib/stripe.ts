import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Gratuit',
    description: 'Pour découvrir Finora',
    price: { monthly: 0, yearly: 0 },
    limits: {
      companies: 1,
      invoices_per_month: 10,
      bank_statements_per_month: 2,
      employees: 3,
      chat_messages_per_day: 20,
    },
    features: [
      '1 société',
      '10 factures/mois',
      '2 relevés bancaires/mois',
      '3 salariés',
      'Export ARF & FEC',
      'Expert IA (20 messages/jour)',
    ],
  },
  pro: {
    name: 'Finora',
    description: 'Accès complet à tous les modules',
    price: { monthly: 49, yearly: 452 },
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    limits: {
      companies: -1,
      invoices_per_month: -1,
      bank_statements_per_month: -1,
      employees: -1,
      chat_messages_per_day: -1,
    },
    features: [
      'Sociétés illimitées',
      'Factures illimitées',
      'Relevés bancaires illimités',
      'Salariés illimités',
      'Facturation Électronique 2026',
      'Audit IA complet',
      'Expert IA illimité',
      'Export ARF · FEC · PDF · CSV',
      'Toutes les mises à jour',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan].limits
}

export function isWithinLimits(
  plan: PlanType,
  resource: keyof (typeof PLANS)['free']['limits'],
  current: number
): boolean {
  const limit = PLANS[plan].limits[resource]
  if (limit === -1) return true
  return current < limit
}
