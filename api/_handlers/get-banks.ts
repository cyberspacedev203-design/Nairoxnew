// Cache for banks data
let cachedBanks: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cachedBanks && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached banks:', cachedBanks.length);
      return res.status(200).json({
        banks: cachedBanks,
        cached: true
      });
    }

    // Retrieve API Key
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;

    console.log('PAYSTACK_SECRET_KEY exists:', !!PAYSTACK_SECRET_KEY);
    console.log('PAYSTACK_SECRET_KEY length:', PAYSTACK_SECRET_KEY?.length);
    console.log('PAYSTACK_SECRET_KEY starts with sk_live:', PAYSTACK_SECRET_KEY?.startsWith('sk_live'));

    if (!PAYSTACK_SECRET_KEY) {
      console.log('PAYSTACK_SECRET_KEY is not set in environment variables');
      return res.status(500).json({ error: "PAYSTACK_SECRET_KEY not configured" });
    }

    const paystackUrls = [
      "https://api.paystack.co/bank?country=NG",
      "https://api.paystack.co/bank"
    ];

    let successfulBanks: any[] = [];
    let lastError: any = null;
    let usedUrl = "";

    const normalizeBanks = (banks: any[]) => banks
      .map((bank: any) => ({
        name: bank.name || bank.bank_name || bank.bank,
        code: (bank.code || bank.bank_code || bank.bankCode || bank.bankcode || bank.bank_code)?.toString(),
      }))
      .filter((bank: any) => bank.name && bank.code);

    for (const url of paystackUrls) {
      try {
        console.log('Requesting Paystack bank list from:', url);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Accept": "application/json",
          },
        });

        console.log('Paystack response status for', url, response.status);
        const payload = await response.json();
        console.log('Paystack payload for', url, JSON.stringify(payload, null, 2));

        if (!response.ok) {
          lastError = payload;
          console.log('Paystack returned non-ok status for', url, payload);
          continue;
        }

        if (!payload || payload.status !== true || !Array.isArray(payload.data)) {
          lastError = payload;
          console.log('Paystack returned invalid payload for', url, payload);
          continue;
        }

        const normalized = normalizeBanks(payload.data);
        console.log('Normalized banks count for', url, normalized.length);

        if (normalized.length > 0) {
          successfulBanks = normalized;
          usedUrl = url;
          break;
        }

        lastError = {
          error: 'No banks returned from Paystack',
          payload,
          url
        };
      } catch (fetchError) {
        lastError = fetchError;
        console.log('Fetch error for', url, fetchError);
        continue;
      }
    }

    if (successfulBanks.length === 0) {
      console.log('No banks returned from Paystack via any URL, using fallback. Last error:', lastError);
      const fallbackBanks = [
        { name: "[FALLBACK] Access Bank", code: "044" },
        { name: "[FALLBACK] First Bank", code: "011" },
        { name: "[FALLBACK] GTBank", code: "058" },
        { name: "[FALLBACK] Zenith Bank", code: "057" },
        { name: "[FALLBACK] UBA", code: "033" },
        { name: "[FALLBACK] Moniepoint MFB", code: "50515" },
        { name: "[FALLBACK] Opay", code: "999992" }
      ];
      return res.status(200).json({
        banks: fallbackBanks,
        fallback: true,
        error: "No banks returned from Paystack API, using fallback banks",
        details: lastError
      });
    }

    console.log('Successfully fetched banks from Paystack using', usedUrl, 'count:', successfulBanks.length);
    cachedBanks = successfulBanks;
    cacheTimestamp = now;
    res.setHeader("Cache-Control", "public, max-age=43200"); // Cache for 12 hours
    return res.status(200).json({
      banks: successfulBanks,
      cached: false,
      count: successfulBanks.length,
      source: usedUrl
    });

  } catch (error) {
    console.error("Error fetching banks:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
