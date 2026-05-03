'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { TEMPLATE_REGISTRY, SAMPLE_VARS, RENDERERS } from '@/lib/email/template-registry'

export async function getEmailTemplatePreview(
  templateId: string,
): Promise<{ subject: string; html: string } | { error: string }> {
  const renderer = RENDERERS[templateId]
  const vars = SAMPLE_VARS[templateId as keyof typeof SAMPLE_VARS]

  if (!renderer || !vars) {
    const tmpl = TEMPLATE_REGISTRY.find((t) => t.id === templateId)
    if (tmpl?.category === 'auth') {
      return {
        subject: tmpl.subject,
        html: `<div style="padding:40px;text-align:center;font-family:monospace;font-size:14px;color:#888;">
          <p>This template is managed via <strong>Supabase Dashboard</strong>.</p>
          <p>Go to Authentication → Email Templates to customize.</p>
        </div>`,
      }
    }
    return { error: 'Template not found or has no renderer' }
  }

  return {
    subject: renderer.subject,
    html: renderer.render(vars),
  }
}

export async function sendTestEmail(
  templateId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const renderer = RENDERERS[templateId]
  const vars = SAMPLE_VARS[templateId as keyof typeof SAMPLE_VARS]

  if (!renderer || !vars) {
    return { success: false, error: 'Template not available for testing' }
  }

  const html = renderer.render(vars)
  const subject = `[TEST] ${renderer.subject}`

  const result = await sendEmail(email, subject, html, {
    emailType: `test-${templateId}`,
  })

  return result
}

export async function getEmailStats(): Promise<{
  totalSent: number
  totalFailed: number
  testEmails: number
}> {
  const supabase = getSupabaseAdmin()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [sentRes, failedRes, testRes] = await Promise.all([
    supabase
      .from('email_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('email_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('sent_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('email_log')
      .select('id', { count: 'exact', head: true })
      .like('email_type', 'test-%'),
  ])

  return {
    totalSent: sentRes.count ?? 0,
    totalFailed: failedRes.count ?? 0,
    testEmails: testRes.count ?? 0,
  }
}
