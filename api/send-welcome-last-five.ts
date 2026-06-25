import type { VercelRequest, VercelResponse } from '@vercel/node';

// Send welcome email immediately to the last 5 joined users.
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE, BREVO_API_KEY, EMAIL_SENDER

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return res.status(500).json({ error: 'Supabase env not configured' });
  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });

  try {
    const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,created_at,welcome_sent&order=created_at.desc&limit=5`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
    });

    if (!profilesRes.ok) {
      const text = await profilesRes.text().catch(() => '');
      console.error('Failed to fetch latest profiles', profilesRes.status, text);
      return res.status(502).json({ error: 'Failed to fetch profiles', details: text });
    }

    const profiles = await profilesRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(200).json({ success: true, message: 'No recent users found' });
    }

    const results: Array<any> = [];

    for (const profile of profiles) {
      const toEmail = profile.email;
      if (!toEmail) {
        results.push({ id: profile.id, ok: false, reason: 'Missing email' });
        continue;
      }

      const userName = profile.full_name || toEmail.split('@')[0];
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
        const text = await sendRes.text().catch(() => '');
        console.error('Brevo send failed for', profile.id, text);
        results.push({ id: profile.id, email: toEmail, ok: false, status: sendRes.status, details: text });
        continue;
      }

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          },
          body: JSON.stringify({ welcome_sent: true }),
        });
      } catch (err) {
        console.warn('Failed to mark welcome_sent for', profile.id, err);
      }

      results.push({ id: profile.id, email: toEmail, ok: true });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('send-welcome-last-five error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
