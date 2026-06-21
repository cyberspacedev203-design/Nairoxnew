import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Idempotent endpoint that marks countdowns complete if ended
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  try {
    // Find withdrawals where processing_24h and countdown_ends_at <= now
    const now = new Date().toISOString();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/withdrawals?status=eq.processing_24h&countdown_ends_at=lte.${now}&select=id,user_id`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` }
    });
    const rows = await r.json();
    for (const w of rows) {
      // mark countdown_completed and move to awaiting_admin_approval
      await fetch(`${SUPABASE_URL}/rest/v1/withdrawals?id=eq.${w.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
        body: JSON.stringify({ countdown_completed: true, status: 'awaiting_admin_approval' }),
      });

      // queue admin notification
      await fetch(`${SUPABASE_URL}/rest/v1/email_notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
        body: JSON.stringify({ user_id: w.user_id, type: 'withdrawal_ready_for_admin', payload: { withdrawal_id: w.id } }),
      });
    }

    return res.status(200).json({ success: true, processed: rows.length });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('check-countdowns error', err);
    return res.status(500).json({ success: false, error: 'Failed to check countdowns' });
  }
}
