import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { withdrawal_id } = req.body || {};
  if (!withdrawal_id) return res.status(400).json({ error: 'Missing withdrawal_id' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  try {
    // Fetch withdrawal and profile
    const r = await fetch(`${SUPABASE_URL}/rest/v1/withdrawals?id=eq.${withdrawal_id}&select=*,profiles(*)` , {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` }
    });
    const rows = await r.json();
    const w = rows && rows[0];
    if (!w) return res.status(404).json({ error: 'Withdrawal not found' });

    const profile = w.profiles;
    if (!profile) return res.status(404).json({ error: 'Profile missing' });

    // Validate server-side
    if (Number(profile.balance) < 200000) return res.status(400).json({ error: 'Insufficient balance' });
    if (!profile.email_verified) return res.status(400).json({ error: 'Email not verified' });
    if (!profile.identity_verified) return res.status(400).json({ error: 'Identity not verified' });
    if (!profile.task_completed) return res.status(400).json({ error: 'Task progress incomplete' });

    // Prevent duplicate active timers
    if (w.countdown_started_at) return res.status(400).json({ error: 'Countdown already started' });

    const now = new Date().toISOString();
    const ends = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update withdrawal record
    await fetch(`${SUPABASE_URL}/rest/v1/withdrawals?id=eq.${withdrawal_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({ countdown_started_at: now, countdown_ends_at: ends, countdown_completed: false, status: 'processing_24h' }),
    });

    // Queue notification email
    await fetch(`${SUPABASE_URL}/rest/v1/email_notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({ user_id: profile.id, type: 'withdrawal_processing', payload: { withdrawal_id, amount: w.amount } }),
    });

    return res.status(200).json({ success: true, countdown_started_at: now, countdown_ends_at: ends });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('start-withdrawal error', err);
    return res.status(500).json({ success: false, error: 'Failed to start countdown' });
  }
}
