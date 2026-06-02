import { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { requireSuperuser, adminResponse, adminError, auditLog } from '@/lib/admin/middleware'
import { getStripe } from '@/lib/stripe'

// GET /api/admin/promo-codes
// Returns all active + inactive promo codes from Stripe with their coupon
// details and usage counts. Stripe is the source of truth — we don't shadow
// the data into our own table.
export async function GET(request: NextRequest) {
  const auth = await requireSuperuser(request)
  if (!auth.ok) return auth.response

  try {
    const stripe = getStripe()
    const promos = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.promotion.coupon'],
    })

    const rows = promos.data.map((p) => {
      const coupon = typeof p.promotion.coupon === 'object' && p.promotion.coupon
        ? p.promotion.coupon
        : null
      return {
        id: p.id,
        code: p.code,
        active: p.active,
        createdAt: p.created,
        expiresAt: p.expires_at,
        maxRedemptions: p.max_redemptions,
        timesRedeemed: p.times_redeemed,
        firstTimeOnly: p.restrictions.first_time_transaction,
        coupon: coupon
          ? {
              id: coupon.id,
              name: coupon.name ?? null,
              percentOff: coupon.percent_off ?? null,
              amountOff: coupon.amount_off ?? null,
              currency: coupon.currency ?? null,
              duration: coupon.duration,
              durationInMonths: coupon.duration_in_months ?? null,
              valid: coupon.valid,
            }
          : null,
      }
    })

    return adminResponse({ rows })
  } catch (err) {
    console.error('[admin/promo-codes] list failed', err)
    return adminError('STRIPE_ERROR', err instanceof Error ? err.message : 'Failed to load codes', 500)
  }
}

// POST /api/admin/promo-codes
// Creates a coupon + matching promotion code in one shot.
// Body: {
//   code: string,                  // e.g. "PRODUCTHUNT"
//   name?: string,                 // internal label
//   discountType: 'percent' | 'amount',
//   percentOff?: number,           // 1..100
//   amountOff?: number,            // cents
//   currency?: string,             // required when discountType=amount
//   duration: 'once' | 'repeating' | 'forever',
//   durationInMonths?: number,     // required when duration=repeating
//   expiresAt?: number,            // unix seconds, optional
//   maxRedemptions?: number,       // optional
//   firstTimeOnly?: boolean,
// }
export async function POST(request: NextRequest) {
  const auth = await requireSuperuser(request)
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return adminError('BAD_INPUT', 'Invalid JSON body')
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code || code.length < 3 || code.length > 32 || !/^[A-Z0-9-]+$/.test(code)) {
    return adminError('BAD_INPUT', 'Code must be 3-32 chars, A-Z 0-9 - only')
  }

  const discountType = body.discountType === 'amount' ? 'amount' : 'percent'
  const duration = ['once', 'repeating', 'forever'].includes(String(body.duration))
    ? (body.duration as 'once' | 'repeating' | 'forever')
    : null
  if (!duration) return adminError('BAD_INPUT', 'duration must be once | repeating | forever')

  const couponParams: Stripe.CouponCreateParams = {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : code,
    duration,
  }

  if (discountType === 'percent') {
    const pct = Number(body.percentOff)
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return adminError('BAD_INPUT', 'percentOff must be 1-100')
    }
    couponParams.percent_off = pct
  } else {
    const amt = Number(body.amountOff)
    const cur = typeof body.currency === 'string' ? body.currency.toLowerCase() : ''
    if (!Number.isFinite(amt) || amt <= 0) return adminError('BAD_INPUT', 'amountOff must be > 0 (cents)')
    if (!cur) return adminError('BAD_INPUT', 'currency required for amount discounts')
    couponParams.amount_off = Math.round(amt)
    couponParams.currency = cur
  }

  if (duration === 'repeating') {
    const months = Number(body.durationInMonths)
    if (!Number.isFinite(months) || months <= 0 || months > 60) {
      return adminError('BAD_INPUT', 'durationInMonths must be 1-60 for repeating coupons')
    }
    couponParams.duration_in_months = Math.round(months)
  }

  const maxRedemptions = Number(body.maxRedemptions)
  if (Number.isFinite(maxRedemptions) && maxRedemptions > 0) {
    couponParams.max_redemptions = Math.round(maxRedemptions)
  }

  const expiresAt = Number(body.expiresAt)
  const hasExpiry = Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000)
  if (hasExpiry) couponParams.redeem_by = Math.round(expiresAt)

  try {
    const stripe = getStripe()

    // Atomic-ish: create coupon, then promotion code. If the second call fails,
    // we delete the orphan coupon so the next attempt with the same code works.
    const coupon = await stripe.coupons.create(couponParams)

    let promo: Stripe.PromotionCode
    try {
      const promoParams: Stripe.PromotionCodeCreateParams = {
        promotion: { type: 'coupon', coupon: coupon.id },
        code,
        active: true,
      }
      if (body.firstTimeOnly === true) {
        promoParams.restrictions = { first_time_transaction: true }
      }
      if (hasExpiry) promoParams.expires_at = Math.round(expiresAt)
      if (Number.isFinite(maxRedemptions) && maxRedemptions > 0) {
        promoParams.max_redemptions = Math.round(maxRedemptions)
      }
      promo = await stripe.promotionCodes.create(promoParams)
    } catch (innerErr) {
      // Clean up the orphan coupon so the operator can retry the same code.
      await stripe.coupons.del(coupon.id).catch(() => {})
      throw innerErr
    }

    await auditLog(auth.userId, 'promo_code.create', 'promo_code', promo.id, {
      code,
      coupon: coupon.id,
      discountType,
      duration,
    })

    return adminResponse({ id: promo.id, code: promo.code })
  } catch (err) {
    console.error('[admin/promo-codes] create failed', err)
    return adminError('STRIPE_ERROR', err instanceof Error ? err.message : 'Failed to create code', 500)
  }
}
