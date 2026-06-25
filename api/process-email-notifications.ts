import type { VercelRequest, VercelResponse } from '@vercel/node';

// This endpoint processes queued email_notifications rows and sends them via Brevo (SendinBlue).
// Required env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE
// - BREVO_API_KEY
// - EMAIL_SENDER (the From address)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_SENDER = process.env.EMAIL_SENDER || 'no-reply@nairox9ja.com';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return res.status(500).json({ error: 'Supabase env not configured' });
  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });

  try {
    // Fetch queued notifications
    const listRes = await fetch(`${SUPABASE_URL}/rest/v1/email_notifications?sent=eq.false&limit=20&select=*`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
    });

    const rows = await listRes.json();
    if (!Array.isArray(rows)) return res.status(500).json({ error: 'Invalid response from supabase' });

    const results: Array<any> = [];

    for (const n of rows) {
      try {
        const payload = n.payload || {};
        // Determine recipient email
        let toEmail = payload.email || null;
        if (!toEmail) {
          // try to fetch from profiles
          const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${n.user_id}&select=email`, {
            headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
          });
          const pr = await r.json();
          if (Array.isArray(pr) && pr[0] && pr[0].email) toEmail = pr[0].email;
        }

        if (!toEmail) {
          results.push({ id: n.id, ok: false, reason: 'No recipient email' });
          continue;
        }

        let subject = 'Notification from Nairox9ja';
        let htmlContent = '<p>Notification from Nairox9ja</p>';

        if (n.type === 'email_verification') {
          subject = 'Verify your Nairox9ja email address';
          htmlContent = `<p>Welcome to Nairox9ja!</p><p>Your verification code is <strong>${payload.code || ''}</strong>. It expires in 30 minutes.</p>`;
        } else if (n.type === 'withdrawal_eligibility') {
          subject = 'Withdrawal Eligibility Reached';
          htmlContent = `<p>Congratulations! Your account has reached the minimum withdrawal amount (₦${payload.balance?.toLocaleString ? payload.balance.toLocaleString() : payload.balance}).</p><p>Please ensure your email is verified and complete identity verification and task requirements before submitting a withdrawal request.</p>`;
        } else if (n.type === 'withdrawal_processing') {
          subject = 'Your withdrawal request is being processed';
          htmlContent = `<p>Your withdrawal request (ID: ${payload.withdrawal_id}) is being processed. We'll notify you when it's ready for admin approval.</p>`;
        } else if (n.type === 'withdrawal_ready_for_admin') {
          subject = 'Withdrawal ready for admin approval';
          htmlContent = `<p>A withdrawal has finished the 24-hour processing window and is awaiting admin approval (ID: ${payload.withdrawal_id}).</p>`;
        } else {
          subject = payload.subject || subject;
          htmlContent = payload.html || JSON.stringify(payload);
        }

        // send via Brevo (use official api.brevo.com host)
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
          const text = await sendRes.text();
          results.push({ id: n.id, ok: false, status: sendRes.status, text });
          continue;
        }

        // mark notification as sent
        await fetch(`${SUPABASE_URL}/rest/v1/email_notifications?id=eq.${n.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          },
          body: JSON.stringify({ sent: true, sent_at: new Date().toISOString() }),
        });

        results.push({ id: n.id, ok: true });
      } catch (err) {
        // log and continue
        // eslint-disable-next-line no-console
        console.error('send notification error', err);
        results.push({ id: n.id, ok: false, error: String(err) });
      }
    }

    return res.status(200).json({ processed: results.length, results });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('process-email-notifications error', err);
    return res.status(500).json({ success: false, error: 'Failed to process notifications' });
  }
}
