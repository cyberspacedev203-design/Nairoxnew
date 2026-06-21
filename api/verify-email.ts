import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, code } = req.body || {};
  if (!user_id || !code) return res.status(400).json({ error: 'Missing user_id or code' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  try {
    // Fetch profile to compare token
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email_verification_token,email_token_expires_at,email_verified`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` }
    });
    const rows = await r.json();
    const profile = rows && rows[0];
    if (!profile) return res.status(404).json({ error: 'User not found' });
    if (profile.email_verified) return res.status(200).json({ success: true, message: 'Already verified' });

    if (profile.email_verification_token !== code) return res.status(400).json({ success: false, error: 'Invalid code' });
    const expires = profile.email_token_expires_at ? new Date(profile.email_token_expires_at) : null;
    if (expires && expires < new Date()) return res.status(400).json({ success: false, error: 'Code expired' });

    // Mark email_verified and clear token
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ email_verified: true, email_verification_token: null, email_token_expires_at: null }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('verify-email error', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
