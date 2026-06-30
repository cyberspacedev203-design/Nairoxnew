// Sends a styled welcome email immediately via Brevo after signup.
// Required env: BREVO_API_KEY, EMAIL_SENDER
// Optional env: SUPABASE_URL, SUPABASE_SERVICE_ROLE (only needed if email not in body)

export function buildWelcomeHtml(userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Nairox9ja</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;border:1px solid #2d2d5e;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 32px 24px;text-align:center;">
              <div style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:1px;">Nairox9ja</div>
              <div style="font-size:13px;color:#c4b5fd;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Stay Active. Keep Earning.</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 0;">
              <h1 style="margin:0;font-size:22px;color:#f1f5f9;line-height:1.4;">
                🎉 Welcome to Nairox9ja, <span style="color:#a78bfa;">${userName}</span>! 💚
              </h1>
              <p style="margin:16px 0 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                We're excited to have you as part of the <strong style="color:#c4b5fd;">Nairox9ja</strong> community.
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                Thank you for creating your account. Your journey starts here, and there are plenty of opportunities waiting for you.
              </p>
            </td>
          </tr>

          <!-- What you can do -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">Here's what you can do:</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="padding:6px 0;">
                  <div style="background:#1e1e40;border-left:3px solid #7c3aed;border-radius:6px;padding:10px 14px;font-size:14px;color:#c4b5fd;">✅ &nbsp;Claim rewards regularly</div>
                </td></tr>
                <tr><td style="padding:6px 0 0;">
                  <div style="background:#1e1e40;border-left:3px solid #7c3aed;border-radius:6px;padding:10px 14px;font-size:14px;color:#c4b5fd;">✅ &nbsp;Complete daily tasks</div>
                </td></tr>
                <tr><td style="padding:6px 0 0;">
                  <div style="background:#1e1e40;border-left:3px solid #7c3aed;border-radius:6px;padding:10px 14px;font-size:14px;color:#c4b5fd;">✅ &nbsp;Invite friends and earn referral rewards</div>
                </td></tr>
                <tr><td style="padding:6px 0 0;">
                  <div style="background:#1e1e40;border-left:3px solid #7c3aed;border-radius:6px;padding:10px 14px;font-size:14px;color:#c4b5fd;">✅ &nbsp;Unlock more features as you stay active</div>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.8;">
                To get the best experience, we recommend <strong style="color:#e2e8f0;">verifying your email</strong> and exploring the Help Center for quick video tutorials on how everything works.
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;line-height:1.8;">
                Our goal is to provide a simple, secure, and rewarding experience for every user.
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;line-height:1.8;">
                We wish you success on your journey with Nairox9ja!
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <a href="https://nairoxnew.vercel.app/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                Go to Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;">
              <div style="border-top:1px solid #2d2d5e;padding-top:20px;text-align:center;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#a78bfa;">
                  💚 Stay Active. Keep Earning. Keep Growing.
                </p>
                <p style="margin:8px 0 0;font-size:13px;color:#64748b;">The Nairox9ja Team</p>
                <p style="margin:12px 0 0;font-size:11px;color:#374151;">
                  You received this because you created an account on Nairox9ja.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, email, username, full_name } = req.body || {};
  if (!email && !user_id) return res.status(400).json({ error: 'Missing email or user_id' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  }

  // Resolve display name — priority: username > full_name > email prefix
  let toEmail: string = email || '';
  let userName: string =
    (typeof username === 'string' && username.trim())
      ? username.trim()
      : (typeof full_name === 'string' && full_name.trim())
        ? full_name.trim()
        : '';

  // Only hit Supabase if we're still missing email or name
  if ((!toEmail || !userName) && user_id) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email,username,full_name`,
          {
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
              apikey: SUPABASE_SERVICE_ROLE,
            },
          }
        );
        const rows = await r.json();
        if (!toEmail) toEmail = rows?.[0]?.email || '';
        if (!userName) userName = rows?.[0]?.username || rows?.[0]?.full_name || '';
      } catch (e) {
        console.warn('Could not fetch profile from Supabase', e);
      }
    }
  }

  if (!toEmail) return res.status(400).json({ error: 'Recipient email could not be determined' });
  if (!userName) userName = toEmail.split('@')[0]; // last resort fallback

  try {
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
      console.error('Brevo welcome send failed', sendRes.status, txt);
      return res.status(502).json({
        error: 'Failed to send welcome email',
        brevo_status: sendRes.status,
        details: txt,
      });
    }

    return res.status(200).json({ success: true, sent_to: toEmail, name: userName });
  } catch (err) {
    console.error('send-welcome-immediate error', err);
    return res.status(500).json({ error: String(err) });
  }
}
