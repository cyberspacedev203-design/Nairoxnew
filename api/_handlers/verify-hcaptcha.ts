export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token } = req.body || {};
  const secret = process.env.HCAPTCHA_SECRET || process.env.VITE_HCAPTCHA_SECRET;
  if (!secret) return res.status(500).json({ error: 'hCaptcha secret not configured' });
  if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const r = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await r.json();
    return res.status(200).json({ success: !!data.success, data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('hCaptcha verify error', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
