import { wrapInBaseLayout } from './base'

export const subject = 'Welcome to Top Viso'

export function render(vars: {
  userName: string
  loginUrl: string
}): string {
  return wrapInBaseLayout(
    `
    <h1>Welcome to Top Viso, ${vars.userName}.</h1>
    <p>You're now part of the most advanced App Store Optimization intelligence platform. Here's what you can do:</p>
    <h2>Get started</h2>
    <p><strong>1. Add your first app</strong> — connect your iOS or Android app to start tracking keywords, rankings, and reviews.</p>
    <p><strong>2. Run your first analysis</strong> — our AI will analyze your app's metadata, keywords, and competitive landscape.</p>
    <p><strong>3. Track competitors</strong> — add competitor apps to benchmark your performance and discover opportunities.</p>
    <p style="margin-top: 28px;">
      <a href="${vars.loginUrl}" class="btn">OPEN DASHBOARD</a>
    </p>
    <p style="margin-top: 24px; font-family: 'Courier New', monospace; font-size: 11px; color: #888;">
      If you have any questions, reply to this email — we read every message.
    </p>
    `,
    'Welcome to Top Viso — get started with app store optimization',
  )
}
