import { wrapInBaseLayout } from './base'

export const subject = 'Your Top Viso trial expires soon'

export function render(vars: {
  userName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>Your trial expires in ${vars.daysLeft} day${vars.daysLeft !== 1 ? 's' : ''}.</h1>
    <p>Hi ${vars.userName},</p>
    <p>Your Top Viso free trial is almost over. After it expires, you'll lose access to:</p>
    <p>
      <strong>— AI-powered metadata analysis</strong><br/>
      <strong>— Keyword rank tracking</strong><br/>
      <strong>— Competitive intelligence</strong><br/>
      <strong>— Review sentiment monitoring</strong>
    </p>
    <p>Upgrade now to keep your data and continue optimizing your app store presence.</p>
    <p style="margin-top: 28px;">
      <a href="${vars.upgradeUrl}" class="btn">UPGRADE NOW</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      Questions? Reply to this email and we'll help you choose the right plan.
    </p>
    `,
    `Your Top Viso trial expires in ${vars.daysLeft} days — upgrade to keep your data`,
  )
}
