export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, code, email } = req.body || {};
  if ((!user_id && !email) || !code) return res.status(400).json({ error: 'Missing user_id/email or code' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    apikey: SUPABASE_SERVICE_ROLE,
  };

  try {
    if (user_id) {
      // Fetch profile to compare token
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email_verification_token,email_token_expires_at,email_verified`,
        { headers: sbHeaders }
      );
      const rows = await r.json();
      const profile = rows && rows[0];
      if (!profile) return res.status(404).json({ error: 'User not found' });
      if (profile.email_verified) return res.status(200).json({ success: true, message: 'Already verified' });

      if (profile.email_verification_token !== code) {
        return res.status(400).json({ success: false, error: 'Invalid code' });
      }
      const expires = profile.email_token_expires_at ? new Date(profile.email_token_expires_at) : null;
      if (expires && expires < new Date()) {
        return res.status(400).json({ success: false, error: 'Code expired. Please request a new OTP.' });
      }

      // Mark email_verified and clear token
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
        method: 'PATCH',
        headers: { ...sbHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({
          email_verified: true,
          email_verification_token: null,
          email_token_expires_at: null,
        }),
      });

      return res.status(200).json({ success: true });
    }

    // Verify by email using email_verifications table (pre-signup flow)
    const vr = await fetch(
      `${SUPABASE_URL}/rest/v1/email_verifications?email=eq.${encodeURIComponent(email)}&code=eq.${encodeURIComponent(code)}&select=id,expires_at,verified`,
      { headers: sbHeaders }
    );
    const vrows = await vr.json();
    const verification = vrows && vrows[0];

    if (!verification) {
      return res.status(400).json({ success: false, error: 'Invalid code. Please check and try again.' });
    }
    if (verification.verified) {
      return res.status(200).json({ success: true, message: 'Already verified' });
    }
    const exp = verification.expires_at ? new Date(verification.expires_at) : null;
    if (exp && exp < new Date()) {
      return res.status(400).json({ success: false, error: 'Code expired. Please request a new OTP.' });
    }

    // Mark row as verified
    await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?id=eq.${verification.id}`, {
      method: 'PATCH',
      headers: sbHeaders,
      body: JSON.stringify({ verified: true }),
    });

    // If a profile already exists with this email, mark it verified too
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: sbHeaders,
      body: JSON.stringify({ email_verified: true }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('verify-email error', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
