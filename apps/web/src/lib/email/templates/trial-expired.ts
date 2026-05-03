import { wrapInBaseLayout } from './base'

export const subject = 'Your Top Viso trial has ended'

export function render(vars: {
  userName: string
  upgradeUrl: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>Your trial has ended.</h1>
    <p>Hi ${vars.userName},</p>
    <p>Your Top Viso free trial has expired. Your data is safe — we keep it for 30 days so you can pick up right where you left off.</p>
    <p>Upgrade to any plan to restore access to your dashboard, keyword tracking, and AI analysis.</p>
    <p style="margin-top: 28px;">
      <a href="${vars.upgradeUrl}" class="btn">RESTORE ACCESS</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      Not ready yet? No worries — your data will be retained for 30 days.
    </p>
    `,
    'Your Top Viso trial has ended — upgrade to restore access',
  )
}
