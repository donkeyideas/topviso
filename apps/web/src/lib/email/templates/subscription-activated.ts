import { wrapInBaseLayout } from './base'

export const subject = 'Your Top Viso plan is now active'

export function render(vars: {
  userName: string
  planName: string
  price: number
  appLimit: number
  keywordLimit: number
  seatLimit: number
  dashboardUrl: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>You're on the ${vars.planName} plan.</h1>
    <p>Your subscription is active and your workspace has been upgraded. Here's what's included:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.06em; color: #888;">PLAN</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; text-align: right; font-weight: 600;">${vars.planName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.06em; color: #888;">PRICE</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; text-align: right; font-weight: 600;">$${vars.price}/mo</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.06em; color: #888;">APPS</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; text-align: right;">Up to ${vars.appLimit}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.06em; color: #888;">KEYWORDS</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e0; text-align: right;">${vars.keywordLimit.toLocaleString()} tracked</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.06em; color: #888;">SEATS</td>
        <td style="padding: 10px 0; text-align: right;">${vars.seatLimit} members</td>
      </tr>
    </table>
    <p style="margin-top: 28px;">
      <a href="${vars.dashboardUrl}" class="btn">OPEN DASHBOARD</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      You can manage your subscription anytime from Settings &rarr; Billing.
    </p>
    `,
    `Your ${vars.planName} plan is active — $${vars.price}/mo`,
  )
}
