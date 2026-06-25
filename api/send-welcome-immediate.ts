import type { VercelRequest, VercelResponse } from '@vercel/node';

// Send welcome email immediately via Brevo (no queue).
// Required env: BREVO_API_KEY, EMAIL_SENDER, SUPABASE_URL, SUPABASE_SERVICE_ROLE

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, email } = req.body || {};
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id or email' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return res.status(500).json({ error: 'Supabase env not configured' });

  try {
    const { full_name } = req.body || {};
    let toEmail = email || null;
    let userName = typeof full_name === 'string' && full_name.trim() ? full_name.trim() : '';

    if (!toEmail && user_id) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email,full_name`, {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
      });
      const rows = await r.json();
      toEmail = rows?.[0]?.email || null;
      if (!userName) userName = rows?.[0]?.full_name || '';
    }

    if (!toEmail) return res.status(400).json({ error: 'Recipient email not found' });
    if (!userName) {
      userName = (toEmail || '').split('@')[0];
    }

    const subject = 'Welcome to Nairox9ja — Your account is ready';
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#ffffff;border-radius:8px;color:#0f172a;">
        <h2 style="color:#7c3aed;margin-bottom:8px;">🎉 Welcome to Nairox9ja, ${userName}! 💚</h2>
        <p style="margin-bottom:12px;">We’re excited to have you as part of the Nairox9ja community.</p>
        <p>Thank you for creating your account. Your journey starts here, and there are plenty of opportunities waiting for you.</p>
        <ul style="margin-top:12px;color:#0f172a;">
          <li>✅ Claim rewards regularly</li>
          <li>✅ Complete daily tasks</li>
          <li>✅ Invite friends and earn referral rewards</li>
          <li>✅ Unlock more features as you stay active</li>
        </ul>
        <p style="margin-top:12px;font-size:13px;color:#475569;">To get the best experience, we recommend verifying your email and exploring the Help Center for quick video tutorials on how everything works.</p>
        <p style="margin-top:12px;font-size:13px;color:#475569;">Our goal is to provide a simple, secure, and rewarding experience for every user.</p>
        <p style="margin-top:12px;font-size:13px;color:#475569;">💚 Stay Active. Keep Earning. Keep Growing.</p>
        <p style="margin-top:16px;font-size:13px;color:#475569;">The Nairox9ja Team</p>
      </div>
    `;

    const sendRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: EMAIL_SENDER, name: 'Nairox9ja' },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!sendRes.ok) {
      const txt = await sendRes.text().catch(() => '');
      console.error('Brevo welcome send failed', sendRes.status, txt);
      return res.status(502).json({ error: 'Failed to send welcome email', details: txt });
    }

    // mark profile welcome_sent true if user_id present
    try {
      if (user_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
          body: JSON.stringify({ welcome_sent: true }),
        });
      }
    } catch (e) {
      console.warn('Failed to mark welcome_sent', e);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-welcome-immediate error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
