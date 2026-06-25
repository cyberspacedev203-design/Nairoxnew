import type { VercelRequest, VercelResponse } from '@vercel/node';

// Enqueue a welcome email into email_notifications (processed by process-email-notifications)
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, email } = req.body || {};
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id or email' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return res.status(500).json({ error: 'Supabase env not configured' });

  try {
    // Try to include full name in payload when available
    let full_name = null;
    if (user_id) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=full_name`, {
          headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
        });
        const jr = await r.json();
        full_name = jr?.[0]?.full_name || null;
      } catch (e) {
        full_name = null;
      }
    }

    const payload: any = { email, full_name };
    await fetch(`${SUPABASE_URL}/rest/v1/email_notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({ user_id: user_id || null, type: 'welcome', payload }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('send-welcome error', err);
    return res.status(500).json({ error: 'Failed to enqueue welcome email' });
  }
}
