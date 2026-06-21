import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, email } = req.body || {};
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id or email' });

  // Generate a short numeric code (6 digits)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 mins

  try {
    // Generate code and expiration
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase env not configured' });
    }

    // If user_id provided, store token in profiles; otherwise store in email_verifications table keyed by email
    const doFetch = async (url: string, opts: any) => {
      const r = await fetch(url, opts);
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.error('Supabase request failed', url, r.status, txt);
        throw new Error(`Upstream request failed: ${r.status}`);
      }
      return r.json().catch(() => null);
    };

    if (user_id) {
      await doFetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ email_verification_token: code, email_token_expires_at: expiresAt, valid_email_confirmed: false }),
      });

      // Queue email notification referencing user
      await doFetch(`${SUPABASE_URL}/rest/v1/email_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        },
        body: JSON.stringify({ user_id, type: 'email_verification', payload: { email, code } }),
      });
    } else {
      // store in email_verifications table
      await doFetch(`${SUPABASE_URL}/rest/v1/email_verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        },
        body: JSON.stringify({ email, code, expires_at: expiresAt }),
      });

      // Queue email notification with no user_id
      await doFetch(`${SUPABASE_URL}/rest/v1/email_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        },
        body: JSON.stringify({ user_id: null, type: 'email_verification', payload: { email, code } }),
      });
    }

    return res.status(200).json({ success: true, expiresAt });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('send-email-verification error', err);
    return res.status(500).json({ success: false, error: 'Failed to queue verification email' });
  }
}
