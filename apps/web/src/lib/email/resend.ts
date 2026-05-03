import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const FROM =
  process.env.EMAIL_FROM ?? 'Top Viso <noreply@donkeyideas.com>'

interface EmailMeta {
  emailType: string
  userId?: string
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  meta?: EmailMeta,
): Promise<{ success: boolean; error?: string; resendId?: string }> {
  const resend = getResend()
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      // Log failure
      await supabase.from('email_log').insert({
        recipient_email: Array.isArray(to) ? to.join(', ') : to,
        subject,
        email_type: meta?.emailType ?? 'unknown',
        status: 'failed',
        error_message: error.message,
      })
      return { success: false, error: error.message }
    }

    // Log success
    await supabase.from('email_log').insert({
      resend_id: data?.id ?? null,
      recipient_email: Array.isArray(to) ? to.join(', ') : to,
      subject,
      email_type: meta?.emailType ?? 'unknown',
      status: 'sent',
    })

    return { success: true, resendId: data?.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Send failed'

    try {
      await supabase.from('email_log').insert({
        recipient_email: Array.isArray(to) ? to.join(', ') : to,
        subject,
        email_type: meta?.emailType ?? 'unknown',
        status: 'failed',
        error_message: message,
      })
    } catch {
      // silent-fail log
    }

    return { success: false, error: message }
  }
}
