export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accountNumber, bankCode } = req.body;

    console.log('Received body:', { accountNumber, bankCode });

    if (!accountNumber || !bankCode) {
      console.log('Missing required fields:', { accountNumber, bankCode });
      return res.status(400).json({
        error: "Account number and bank code are required",
        received: { accountNumber, bankCode },
      });
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;

    console.log('PAYSTACK_SECRET_KEY exists:', !!PAYSTACK_SECRET_KEY);
    console.log('PAYSTACK_SECRET_KEY length:', PAYSTACK_SECRET_KEY?.length);

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "PAYSTACK_SECRET_KEY not configured" });
    }

    // Call Paystack API to resolve account
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log('Paystack response:', { status: response.status, ok: response.ok, data });

    if (response.ok && data.status) {
      return res.status(200).json({
        accountName: data.data.account_name,
      });
    } else {
      return res.status(400).json({
        error: "Could not verify account",
        fallback: true,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
