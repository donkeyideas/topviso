import { wrapInBaseLayout } from './base'

export const subject = 'Top Viso Notification'

export function render(vars: {
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}): string {
  const actionBlock = vars.actionUrl
    ? `<p style="margin-top: 28px;">
        <a href="${vars.actionUrl}" class="btn">${vars.actionLabel ?? 'VIEW DETAILS'}</a>
      </p>`
    : ''

  return wrapInBaseLayout(
    `
    <h1>${vars.title}</h1>
    <p>${vars.message}</p>
    ${actionBlock}
    `,
    vars.title,
  )
}
