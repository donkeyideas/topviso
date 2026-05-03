import * as welcomeTemplate from '@/lib/email/templates/welcome'
import * as trialExpiringTemplate from '@/lib/email/templates/trial-expiring'
import * as trialExpiredTemplate from '@/lib/email/templates/trial-expired'
import * as notificationTemplate from '@/lib/email/templates/notification'
import * as subscriptionActivatedTemplate from '@/lib/email/templates/subscription-activated'
import * as paymentFailedTemplate from '@/lib/email/templates/payment-failed'
import * as teamInviteTemplate from '@/lib/email/templates/team-invite'

export interface EmailTemplate {
  id: string
  name: string
  category: 'transactional' | 'lifecycle' | 'notification' | 'auth'
  description: string
  trigger: string
  subject: string
  canSendTest: boolean
}

export const TEMPLATE_REGISTRY: EmailTemplate[] = [
  // Transactional
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'transactional',
    description: 'Sent to new users after signup.',
    trigger: 'User completes registration',
    subject: welcomeTemplate.subject,
    canSendTest: true,
  },
  {
    id: 'contact-confirmation',
    name: 'Contact Confirmation',
    category: 'transactional',
    description: 'Confirmation after contact form submission.',
    trigger: 'Contact form submitted',
    subject: 'We received your message',
    canSendTest: false,
  },
  // Lifecycle
  {
    id: 'trial-expiring',
    name: 'Trial Expiring',
    category: 'lifecycle',
    description: 'Reminder 3 days before trial ends.',
    trigger: '3 days before trial end',
    subject: trialExpiringTemplate.subject,
    canSendTest: true,
  },
  {
    id: 'trial-expired',
    name: 'Trial Expired',
    category: 'lifecycle',
    description: 'Sent when trial period ends.',
    trigger: 'Trial end date passed',
    subject: trialExpiredTemplate.subject,
    canSendTest: true,
  },
  // Notification
  {
    id: 'notification',
    name: 'Notification Alert',
    category: 'notification',
    description: 'System event notifications.',
    trigger: 'System events (rank changes, insights)',
    subject: notificationTemplate.subject,
    canSendTest: true,
  },
  {
    id: 'report',
    name: 'Report Delivery',
    category: 'notification',
    description: 'Scheduled analysis reports.',
    trigger: 'Scheduled report generation',
    subject: 'Your Top Viso Report is Ready',
    canSendTest: false,
  },
  // Billing
  {
    id: 'subscription-activated',
    name: 'Subscription Activated',
    category: 'transactional',
    description: 'Sent when a paid plan is activated.',
    trigger: 'Successful payment via Stripe',
    subject: subscriptionActivatedTemplate.subject,
    canSendTest: true,
  },
  {
    id: 'payment-failed',
    name: 'Payment Failed',
    category: 'transactional',
    description: 'Sent when a recurring payment fails.',
    trigger: 'Stripe invoice.payment_failed event',
    subject: paymentFailedTemplate.subject,
    canSendTest: true,
  },
  // Auth (managed via Supabase Dashboard)
  {
    id: 'password-reset',
    name: 'Password Reset',
    category: 'auth',
    description: 'Password reset link.',
    trigger: 'User requests password reset',
    subject: 'Reset your password',
    canSendTest: false,
  },
  {
    id: 'email-confirmation',
    name: 'Email Confirmation',
    category: 'auth',
    description: 'Verify email address.',
    trigger: 'User signs up',
    subject: 'Confirm your email',
    canSendTest: false,
  },
  {
    id: 'magic-link',
    name: 'Magic Link',
    category: 'auth',
    description: 'Passwordless sign-in link.',
    trigger: 'User requests magic link',
    subject: 'Your sign-in link',
    canSendTest: false,
  },
  {
    id: 'invite',
    name: 'Team Invite',
    category: 'transactional',
    description: 'Organization invitation sent to new team members.',
    trigger: 'Admin invites team member',
    subject: teamInviteTemplate.subject,
    canSendTest: true,
  },
  {
    id: 'email-change',
    name: 'Email Change',
    category: 'auth',
    description: 'Confirm email address change.',
    trigger: 'User changes email',
    subject: 'Confirm your new email',
    canSendTest: false,
  },
]

export const SAMPLE_VARS = {
  welcome: {
    userName: 'Alex',
    loginUrl: 'https://aso.dev/app',
  },
  'trial-expiring': {
    userName: 'Alex',
    daysLeft: 3,
    upgradeUrl: 'https://aso.dev/pricing',
  },
  'trial-expired': {
    userName: 'Alex',
    upgradeUrl: 'https://aso.dev/pricing',
  },
  notification: {
    title: 'Keyword Rank Change',
    message:
      'Your app "Widget Pro" moved from #12 to #5 for the keyword "widget organizer". This is a significant improvement worth monitoring.',
    actionUrl: 'https://aso.dev/app',
    actionLabel: 'VIEW DASHBOARD',
  },
  'subscription-activated': {
    userName: 'Alex',
    planName: 'Team',
    price: 49,
    appLimit: 10,
    keywordLimit: 5000,
    seatLimit: 5,
    dashboardUrl: 'https://aso.dev/app',
  },
  'payment-failed': {
    userName: 'Alex',
    planName: 'Team',
    settingsUrl: 'https://aso.dev/settings/billing',
  },
  invite: {
    inviterName: 'Alex',
    orgName: 'Acme Corp',
    inviteUrl: 'https://aso.dev/invite/abc123',
    role: 'member',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RENDERERS: Record<string, { subject: string; render: (vars: any) => string }> = {
  welcome: welcomeTemplate,
  'trial-expiring': trialExpiringTemplate,
  'trial-expired': trialExpiredTemplate,
  notification: notificationTemplate,
  'subscription-activated': subscriptionActivatedTemplate,
  'payment-failed': paymentFailedTemplate,
  invite: teamInviteTemplate,
}
