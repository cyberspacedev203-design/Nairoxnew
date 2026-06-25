import type { VercelRequest, VercelResponse } from '@vercel/node';

// Sends an OTP verification email directly via Brevo (no queue).
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE
//   BREVO_API_KEY
//   EMAIL_SENDER  (defaults to no-reply@nairox9ja.com)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, email } = req.body || {};
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id or email' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }
  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  }

  // Generate a 6-digit OTP and 30-minute expiry
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

  const sbHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    apikey: SUPABASE_SERVICE_ROLE,
  };

  const doFetch = async (url: string, opts: RequestInit) => {
    const r = await fetch(url, opts);
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('Supabase request failed', url, r.status, txt);
      throw new Error(`Supabase upstream error ${r.status}: ${txt}`);
    }
    return r.json().catch(() => null);
  };

  try {
    // Resolve the recipient email address
    let toEmail = email || null;

    if (user_id) {
      // Store OTP on the profiles row (uses email_verification_token + email_token_expires_at columns)
      await doFetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
        method: 'PATCH',
        headers: { ...sbHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({
          email_verification_token: code,
          email_token_expires_at: expiresAt,
          email_verified: false,
        }),
      });

      // If no email passed in body, fetch it from profiles
      if (!toEmail) {
        const rows: any = await doFetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email`,
          { method: 'GET', headers: sbHeaders }
        );
        toEmail = rows?.[0]?.email || null;
      }
    } else {
      // Store OTP in email_verifications table keyed by email.
      // If a row already exists, update it; otherwise insert a new row.
      const existingRows: any = await doFetch(
        `${SUPABASE_URL}/rest/v1/email_verifications?email=eq.${encodeURIComponent(email)}&select=id`,
        { method: 'GET', headers: sbHeaders }
      );
      const existingId = Array.isArray(existingRows) && existingRows[0]?.id;

      if (existingId) {
        await doFetch(`${SUPABASE_URL}/rest/v1/email_verifications?id=eq.${existingId}`, {
          method: 'PATCH',
          headers: {
            ...sbHeaders,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ code, expires_at: expiresAt, verified: false }),
        });
      } else {
        await doFetch(`${SUPABASE_URL}/rest/v1/email_verifications`, {
          method: 'POST',
          headers: {
            ...sbHeaders,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ email, code, expires_at: expiresAt, verified: false }),
        });
      }
    }

    if (!toEmail) {
      return res.status(400).json({ error: 'Could not determine recipient email' });
    }

    // Send OTP email directly via Brevo
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: EMAIL_SENDER, name: 'Nairox9ja' },
        to: [{ email: toEmail }],
        subject: 'Your Nairox9ja Verification Code',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f0f1a;border-radius:12px;color:#e2e8f0;">
            <h2 style="color:#a78bfa;margin-bottom:8px;">Nairox9ja</h2>
            <p style="margin-bottom:16px;">Hello! Use the code below to verify your email address.</p>
            <div style="background:#1e1e2e;border:2px solid #a78bfa;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:bold;color:#a78bfa;">
              ${code}
            </div>
            <p style="margin-top:16px;font-size:13px;color:#94a3b8;">This code expires in <strong>30 minutes</strong>. Do not share it with anyone.</p>
            <p style="margin-top:8px;font-size:12px;color:#64748b;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text().catch(() => '');
      console.error('Brevo send failed', brevoRes.status, errText);
      return res.status(500).json({ error: `Email send failed: ${brevoRes.status} ${errText}` });
    }

    return res.status(200).json({ success: true, expiresAt });
  } catch (err) {
    console.error('send-email-verification error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
