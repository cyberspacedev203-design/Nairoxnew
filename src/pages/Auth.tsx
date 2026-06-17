import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Referral code handling
  const refParam = searchParams.get("ref");
  const storedRef = localStorage.getItem("referralCode") || "";
  const initialRefCode = refParam || storedRef;

  useEffect(() => {
    if (refParam) {
      localStorage.setItem("referralCode", refParam);
    }
  }, [refParam]);

  const [signupData, setSignupData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: initialRefCode,
    hp: "",
  });

  const [formRenderTime, setFormRenderTime] = useState<number>(Date.now());
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    setFormRenderTime(Date.now());

    // prefer hCaptcha if configured, otherwise fallback to Turnstile
    if (HCAPTCHA_SITE_KEY) {
      (window as any).onHcaptchaSuccess = (token: string) => {
        (window as any).__hcaptcha_token = token;
      };

      const renderHcaptcha = () => {
        try {
          const container = document.getElementById("hc-widget");
            if (container && (window as any).hcaptcha) {
            (window as any).hcaptcha.render(container, {
              sitekey: HCAPTCHA_SITE_KEY,
              callback: (token: string) => {
                (window as any).__hcaptcha_token = token;
                // verify with server immediately so UI can show authoritative success
                (async () => {
                  try {
                    setCaptchaLoading(true);
                    const r = await fetch('/api/verify-hcaptcha', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token }),
                    });
                    const j = await r.json();
                    setCaptchaVerified(!!j.success);
                  } catch (err) {
                    setCaptchaVerified(false);
                  } finally {
                    setCaptchaLoading(false);
                  }
                })();
              },
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("hCaptcha render failed:", err);
        }
      };

      if (!(window as any).hcaptcha) {
        const s = document.createElement("script");
        s.src = "https://hcaptcha.com/1/api.js";
        s.async = true;
        s.defer = true;
        s.onload = () => renderHcaptcha();
        document.head.appendChild(s);
      } else {
        renderHcaptcha();
      }
    } else if (TURNSTILE_SITE_KEY) {
      (window as any).onTurnstileSuccess = (token: string) => {
        (window as any).__turnstile_token = token;
      };

      const renderTurnstile = () => {
        try {
          const container = document.getElementById("cf-turnstile");
            if (container && (window as any).turnstile) {
            (window as any).turnstile.render(container, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token: string) => {
                (window as any).__turnstile_token = token;
                (async () => {
                  try {
                    setCaptchaLoading(true);
                    const r = await fetch('/api/verify-turnstile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token }),
                    });
                    const j = await r.json();
                    setCaptchaVerified(!!j.success);
                  } catch (err) {
                    setCaptchaVerified(false);
                  } finally {
                    setCaptchaLoading(false);
                  }
                })();
              },
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("Turnstile render failed:", err);
        }
      };

      if (!(window as any).turnstile) {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.defer = true;
        s.onload = () => renderTurnstile();
        document.head.appendChild(s);
      } else {
        renderTurnstile();
      }
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard", { replace: true });
    };
    checkSession();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // basic validation
    if (!signupData.fullName.trim()) {
      toast.error("Full name is required");
      setIsLoading(false);
      return;
    }
    if (!signupData.username || signupData.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      setIsLoading(false);
      return;
    }
    try {
      if (signupData.password !== signupData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Honeypot check (bots often fill hidden fields)
      if (signupData.hp && signupData.hp.trim() !== "") {
        throw new Error("Bot detected (honeypot)");
      }

      // Basic timing check (prevent immediate automated submits)
      const elapsed = Date.now() - formRenderTime;
      if (elapsed < 3000) {
        throw new Error("Please take a moment before submitting the form.");
      }

      // Verification token handling: prefer hCaptcha, fallback to Turnstile
      if (HCAPTCHA_SITE_KEY) {
        const hToken = (window as any).__hcaptcha_token || "";
        if (!hToken) throw new Error("Please complete the captcha.");

        const vt = await fetch("/api/verify-hcaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: hToken }),
        }).then((r) => r.json());
        if (!vt.success) throw new Error("Captcha verification failed. Try again.");
      } else if (TURNSTILE_SITE_KEY) {
        const turnstileToken = (window as any).__turnstile_token || "";
        if (!turnstileToken) throw new Error("Please complete the bot verification.");

        const vt = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        }).then((r) => r.json());
        if (!vt.success) throw new Error("Bot verification failed. Try again.");
      } else {
        // No captcha provider configured: rely on honeypot/timing as a last resort
        console.warn("No captcha provider configured; using honeypot/timing fallback");
      }

      const finalRefCode = signupData.referralCode || localStorage.getItem("referralCode") || "";

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email.trim(),
        password: signupData.password,
        options: {
          data: {
            fullName: signupData.fullName,
            username: signupData.username,
            referralCode: finalRefCode,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      const userId = data.user.id;
      const generatedRefCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      // Create user profile
      await supabase.from("profiles").upsert({
        id: userId,
        email: data.user.email!,
        full_name: signupData.fullName,
        username: signupData.username,
        referral_code: generatedRefCode,
        balance: 50000,
        total_referrals: 0,
      });

      // Welcome bonus
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "credit",
        amount: 50000,
        description: "Welcome bonus",
        status: "completed",
      });

      // Handle referral
      if (finalRefCode && finalRefCode.trim() !== "") {
        console.log("🔍 DEBUG: Looking for referrer with code:", finalRefCode.trim());
        
        const { data: referrer, error: referrerError } = await supabase
          .from("profiles")
          .select("id, balance, total_referrals, referral_code")
          .ilike("referral_code", finalRefCode.trim())
          .maybeSingle();

        console.log("🔍 DEBUG: Referrer found:", referrer);
        console.log("🔍 DEBUG: Referrer error:", referrerError);

        if (referrer) {
          console.log("🔍 DEBUG: Updating referrer:", referrer.id);
          const currentBalance = Number(referrer.balance) || 0;
          const currentReferrals = Number(referrer.total_referrals) || 0;
          
          const newBalance = currentBalance + 10000;
          const newReferrals = currentReferrals + 1;

          console.log("🔍 DEBUG: Current balance:", currentBalance, "referrals:", currentReferrals);
          console.log("🔍 DEBUG: New balance:", newBalance, "referrals:", newReferrals);

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              balance: newBalance,
              total_referrals: newReferrals,
            })
            .eq("id", referrer.id);

          console.log("🔍 DEBUG: Update error:", updateError);

          if (!updateError) {
            console.log("🔍 DEBUG: Successfully updated referrer");
          }

          await supabase.from("transactions").insert({
            user_id: referrer.id,
            type: "credit",
            amount: 10000,
            description: `Referral bonus from ${signupData.fullName}`,
            status: "completed",
          });
        } else {
          console.log("🔍 DEBUG: No referrer found or error occurred");
        }
      }

      localStorage.removeItem("referralCode");
      toast.success("Welcome to Nairox9ja! You got ₦50,000 bonus!");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Signup failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim(),
        password: loginData.password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-lg border-border/50 animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold gradient-text mb-2">Nairox9ja</CardTitle>
          <CardDescription className="text-muted-foreground">
            Turn one click into thousands!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your fullname"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter Username"
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter Email Address"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter Your Password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Retype Your Password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode">Invite By (Optional)</Label>
                  <Input
                    id="referralCode"
                    placeholder="Enter referral (optional)"
                    value={signupData.referralCode}
                    onChange={(e) => setSignupData({ ...signupData, referralCode: e.target.value })}
                    disabled={!!refParam}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded"
                    onChange={(e) => {/* handled below via native form */}}
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    By signing up, you agree to the <a className="text-primary underline">Terms & Services</a>.
                  </label>
                </div>

                {/* Captcha widget container (hCaptcha preferred, then Turnstile) */}
                <div className="mt-2 p-3 rounded-lg border border-border/40 bg-card/80">
                  {HCAPTCHA_SITE_KEY ? (
                    <div className="w-full flex items-center justify-center">
                      <div id="hc-widget" />
                    </div>
                  ) : TURNSTILE_SITE_KEY ? (
                    <div id="cf-turnstile" />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Captcha not configured</div>
                      <div className="text-xs text-muted-foreground">provider</div>
                    </div>
                  )}

                  {/* Show authoritative success indicator when server confirms token */}
                  {captchaLoading ? (
                    <div className="mt-3 p-2 rounded-md bg-yellow-600 text-white flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">…</div>
                      <div className="text-sm font-semibold">Verifying…</div>
                    </div>
                  ) : captchaVerified ? (
                    <div className="mt-3 p-2 rounded-md bg-green-600 text-white flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                      <div className="text-sm font-semibold">Success! Verification completed</div>
                    </div>
                  ) : null}
                </div>

                {/* Honeypot hidden field (bots will fill this) */}
                <input
                  type="text"
                  name="hp"
                  value={signupData.hp}
                  onChange={(e) => setSignupData({ ...signupData, hp: e.target.value })}
                  autoComplete="off"
                  tabIndex={-1}
                  className="hidden"
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold glow-primary py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "REGISTER"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account? <a className="text-primary underline" href="#login">Login here</a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Telegram Support Button */}
      <a
        href="https://t.me/Nairox9jaCustomercarebot"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50"
      >
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
          title="Join Telegram Support"
        >
          <Send size={18} />
          <span className="text-sm">Support</span>
        </button>
      </a>
    </div>
  );
};

export default Auth;