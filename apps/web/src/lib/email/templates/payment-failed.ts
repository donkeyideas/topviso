import { wrapInBaseLayout } from './base'

export const subject = 'Action required: payment failed'

export function render(vars: {
  userName: string
  planName: string
  settingsUrl: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>Your payment didn't go through.</h1>
    <p>We weren't able to process your latest payment for the <strong>${vars.planName}</strong> plan. This usually happens when a card expires or has insufficient funds.</p>
    <p>Please update your payment method to keep your subscription active. If we can't collect payment, your plan will be downgraded to Solo.</p>
    <p style="margin-top: 28px;">
      <a href="${vars.settingsUrl}" class="btn">UPDATE PAYMENT METHOD</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      If you believe this is an error, reply to this email and we'll help sort it out.
    </p>
    `,
    'Your payment failed — update your payment method to keep your plan',
  )
}
