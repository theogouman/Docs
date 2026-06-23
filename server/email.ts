// server/email.ts — Envoi du code OTP. Gmail / Google Workspace par défaut
// (SMTP + mot de passe d'application), Resend si RESEND_API_KEY est défini.
import nodemailer from 'nodemailer'

function htmlBody(code: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #eee">
    <p style="margin:0 0 8px;font-size:14px;color:#555">Dataroom — Vente SAS La Relève Hyères / Maley</p>
    <p style="margin:0 0 16px;font-size:15px">Votre code d'accès :</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;padding:14px 0;background:#fafafa;border-radius:12px;border:1px solid #eee">${code}</div>
    <p style="margin:16px 0 0;font-size:13px;color:#777">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  </div></body></html>`
}
function textBody(code: string): string {
  return `Votre code d'accès à la dataroom est : ${code}\nIl expire dans 10 minutes.`
}

async function sendViaResend(to: string, code: string): Promise<void> {
  const from = process.env.RESEND_FROM || 'Dataroom <onboarding@resend.dev>'
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Votre code d'accès : ${code}`,
      html: htmlBody(code),
      text: textBody(code),
    }),
  })
  if (!r.ok) throw new Error(`Resend ${r.status}`)
}

async function sendViaGmail(to: string, code: string): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD manquants')
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
  await transport.sendMail({
    from: `Dataroom <${user}>`,
    to,
    subject: `Votre code d'accès : ${code}`,
    text: textBody(code),
    html: htmlBody(code),
  })
}

export async function sendCode(to: string, code: string): Promise<void> {
  if (process.env.RESEND_API_KEY) return sendViaResend(to, code)
  return sendViaGmail(to, code)
}
