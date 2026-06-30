import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ success: false, error: 'Missing email' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ success: false, error: 'Supabase env not configured' });
  }
  if (!BREVO_API_KEY) {
    return res.status(500).json({ success: false, error: 'Brevo API key not configured' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,email')
      .eq('email', email.trim())
      .single();

    if (!profile || !profile.id) {
      // Do not leak whether the email exists.
      return res.status(200).json({ success: true });
    }

    const tokenInsert = {
      user_id: profile.id,
      token: otp,
      expires_at: expiresAt,
      used: false,
    };

    await supabaseAdmin.from('password_reset_tokens').insert(tokenInsert);

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: EMAIL_SENDER, name: 'Nairox9ja' },
        to: [{ email: profile.email }],
        subject: 'Nairox9ja Password Reset Code',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f0f1a;border-radius:12px;color:#e2e8f0;">
            <h2 style="color:#a78bfa;margin-bottom:8px;">Nairox9ja Password Reset</h2>
            <p style="margin-bottom:16px;">Use the code below to reset your password. It expires in 30 minutes.</p>
            <div style="background:#1e1e2e;border:2px solid #a78bfa;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:bold;color:#a78bfa;">
              ${otp}
            </div>
            <p style="margin-top:16px;font-size:13px;color:#94a3b8;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text().catch(() => '');
      console.error('Brevo send failed', brevoRes.status, errText);
      return res.status(500).json({ success: false, error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('forgot-password error', err);
    return res.status(500).json({ success: false, error: 'Unable to process password reset' });
  }
}
