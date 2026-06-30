import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { email, code, new_password } = req.body || {};
  if (!email || !code || !new_password) {
    return res.status(400).json({ success: false, error: 'Missing email, code or new password' });
  }
  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ success: false, error: 'Supabase env not configured' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id,email')
      .eq('email', email.trim())
      .single();

    if (profileError || !profile || !profile.id) {
      return res.status(400).json({ success: false, error: 'Invalid OTP or email' });
    }

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id,expires_at,used')
      .eq('user_id', profile.id)
      .eq('token', code.trim())
      .eq('used', false)
      .single();

    if (tokenError || !tokenRow) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP expired. Please request a new code.' });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: new_password,
    });

    if (updateError) {
      console.error('Password update failed', updateError);
      return res.status(500).json({ success: false, error: 'Unable to update password' });
    }

    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id);

    await supabaseAdmin
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', profile.id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ success: false, error: 'Password reset failed' });
  }
}
