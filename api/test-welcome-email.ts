import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildWelcomeHtml } from './send-welcome-immediate';

// Test endpoint: POST /api/test-welcome-email
// Body: { "email": "you@example.com", "name": "Your Name" }   (both optional)
// Defaults to bhadboiice1@gmail.com if no email provided.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY not set in Vercel env vars' });
  }

  const body = req.method === 'POST' ? (req.body || {}) : {};
  const toEmail: string = body.email || 'bhadboiice1@gmail.com';
  const userName: string = body.name  || 'Valued User';

  const sendRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: EMAIL_SENDER, name: 'Nairox9ja' },
      to: [{ email: toEmail }],
      subject: `🎉 Welcome to Nairox9ja, ${userName}!`,
      htmlContent: buildWelcomeHtml(userName),
    }),
  });

  if (!sendRes.ok) {
    const txt = await sendRes.text().catch(() => '');
    return res.status(502).json({
      error: 'Brevo rejected the request',
      brevo_status: sendRes.status,
      details: txt,
    });
  }

  return res.status(200).json({
    success: true,
    sent_to: toEmail,
    message: `Welcome email fired to ${toEmail}. Check the inbox!`,
  });
}
