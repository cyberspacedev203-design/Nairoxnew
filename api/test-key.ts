import type { VercelRequest, VercelResponse } from "@vercel/node";

// Diagnostic endpoint – shows which env vars are present (true/false, never values)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const envCheck = {
    // Supabase
    SUPABASE_URL:          !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    // Brevo email
    BREVO_API_KEY:         !!process.env.BREVO_API_KEY,
    EMAIL_SENDER:          process.env.EMAIL_SENDER || "(not set – will use default)",
    // Paystack
    PAYSTACK_SECRET_KEY:   !!process.env.PAYSTACK_SECRET_KEY,
    // Captcha
    HCAPTCHA_SECRET:       !!process.env.HCAPTCHA_SECRET,
    TURNSTILE_SECRET:      !!process.env.TURNSTILE_SECRET,
  };

  const missing = Object.entries(envCheck)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  return res.status(200).json({
    ok: missing.length === 0,
    missing,
    env: envCheck,
  });
}