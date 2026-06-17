import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.TURNSTILE_SECRET;
    if (!secret) return res.status(500).json({ error: "TURNSTILE_SECRET not configured" });

    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "token missing" });

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await verifyRes.json();
    // data.success is boolean
    return res.status(200).json({ success: !!data.success, data });
  } catch (err: any) {
    console.error("turnstile verify error", err);
    return res.status(500).json({ error: "verification failed", details: err.message });
  }
}
