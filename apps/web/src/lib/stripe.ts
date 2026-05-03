import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (stripe) return stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')

  stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  return stripe
}

export const PLANS = {
  solo: {
    name: 'Solo',
    priceMonthly: 0,
    apps: 1,
    keywords: 50,
    seats: 1,
  },
  team: {
    name: 'Team',
    priceMonthly: 49,
    apps: 5,
    keywords: 500,
    seats: 5,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID ?? '',
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 199,
    apps: 50,
    keywords: 5000,
    seats: 25,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
  },
} as const
