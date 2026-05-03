import { wrapInBaseLayout } from './base'

export const subject = "You're invited to join a team on Top Viso"

export function render(vars: {
  inviterName: string
  orgName: string
  inviteUrl: string
  role: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>You've been invited.</h1>
    <p><strong>${vars.inviterName}</strong> has invited you to join <strong>${vars.orgName}</strong> on Top Viso as a <strong>${vars.role}</strong>.</p>
    <p>Top Viso is an App Store Optimization intelligence platform — your team is already using it to track keywords, analyze competitors, and optimize app listings.</p>
    <p style="margin-top: 28px;">
      <a href="${vars.inviteUrl}" class="btn">ACCEPT INVITATION</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
    </p>
    `,
    "You've been invited to join a team on Top Viso",
  )
}
