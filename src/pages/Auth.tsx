import { useState, useEffect, useRef } from "react";
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
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolledEnd, setTermsScrolledEnd] = useState(false);
  const termsContentRef = useRef<HTMLDivElement | null>(null);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    setFormRenderTime(Date.now());

    // prefer hCaptcha if configured, otherwise fallback to Turnstile
    if (HCAPTCHA_SITE_KEY) {
      const renderHcaptcha = () => {
        try {
          const captchaCallback = (token: string) => {
            (window as any).__hcaptcha_token = token;
          };
          const container = document.getElementById("hc-widget");
          const containerLogin = document.getElementById("hc-widget-login");
          if ((window as any).hcaptcha) {
            if (container && !container.hasChildNodes()) {
              try {
                (window as any).hcaptcha.render(container, {
                  sitekey: HCAPTCHA_SITE_KEY,
                  callback: captchaCallback,
                });
              } catch (e) {}
            }
            if (containerLogin && !containerLogin.hasChildNodes()) {
              try {
                (window as any).hcaptcha.render(containerLogin, {
                  sitekey: HCAPTCHA_SITE_KEY,
                  callback: captchaCallback,
                });
              } catch (e) {}
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("hCaptcha render failed:", err);
        }
      };

      // Define the global onload callback BEFORE the script tag is injected.
      // hCaptcha's render=explicit + onload=onHcaptchaLoad pattern is the
      // correct way to avoid the "should not render before js api is fully loaded" warning.
      (window as any).onHcaptchaLoad = renderHcaptcha;

      if (!(window as any).hcaptcha) {
        const s = document.createElement("script");
        s.src = `https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaLoad`;
        s.async = true;
        s.defer = true;
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
          const containerLogin = document.getElementById("cf-turnstile-login");
          if ((container || containerLogin) && (window as any).turnstile) {
            if (container) {
              try {
                (window as any).turnstile.render(container, {
                  sitekey: TURNSTILE_SITE_KEY,
                  callback: (token: string) => {
                    (window as any).__turnstile_token = token;
                  },
                });
              } catch (e) {}
            }
            if (containerLogin) {
              try {
                (window as any).turnstile.render(containerLogin, {
                  sitekey: TURNSTILE_SITE_KEY,
                  callback: (token: string) => {
                    (window as any).__turnstile_token = token;
                  },
                });
              } catch (e) {}
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("Turnstile render failed:", err);
        }
      };

      if (!(window as any).turnstile) {
        const s = document.createElement("script");
        // Request explicit render to reduce race conditions with the global API
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
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

      // If user requested OTP, verify it before creating account
      if (otpRequested) {
        if (!otp || otp.trim().length === 0) throw new Error('Please enter the OTP sent to your email');
        const vr = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: signupData.email, code: otp }) }).then(r => r.json());
        if (!vr || !vr.success) {
          throw new Error(vr?.error || 'OTP verification failed');
        }
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
      // enqueue welcome email
      try {
        fetch('/api/send-welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, email: data.user.email }) });
      } catch (e) {
        console.warn('Failed to enqueue welcome email', e);
      }
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
      // Verify captcha token if provider configured
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
        const tToken = (window as any).__turnstile_token || "";
        if (!tToken) throw new Error("Please complete the captcha.");
        const vt = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tToken }),
        }).then((r) => r.json());
        if (!vt.success) throw new Error("Captcha verification failed. Try again.");
      }

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
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter Email Address"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      disabled={otpLoading || !signupData.email}
                      onClick={async () => {
                        setOtpLoading(true);
                        try {
                          const otpRes = await fetch('/api/send-email-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: signupData.email }),
                          });
                          const otpData = await otpRes.json().catch(() => ({}));
                          if (!otpRes.ok || !otpData.success) {
                            throw new Error(otpData.error || `Server error (${otpRes.status})`);
                          }
                          setOtpRequested(true);
                          toast.success('OTP sent to your email. Check your inbox.');
                        } catch (e: any) {
                          console.error(e);
                          toast.error(e?.message || 'Failed to send OTP. Please try again.');
                        } finally {
                          setOtpLoading(false);
                        }
                      }}
                      className="px-3 py-2 rounded bg-slate-800 text-white disabled:opacity-50"
                    >
                      {otpLoading ? 'Sending...' : 'Get OTP'}
                    </button>
                  </div>

                  {otpRequested && (
                    <div className="mt-2">
                      <Label htmlFor="otp">OTP</Label>
                      <Input id="otp" placeholder="Enter code from email" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    </div>
                  )}
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
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    By signing up, you agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary underline"
                    >
                      Terms & Services
                    </button>
                    .
                  </label>
                </div>

                {/* Captcha widget container (unstyled so provider renders normally) */}
                <div className="mt-2">
                  {HCAPTCHA_SITE_KEY ? (
                    <div id="hc-widget" />
                  ) : TURNSTILE_SITE_KEY ? (
                    <div id="cf-turnstile" />
                  ) : (
                    <div className="text-sm text-muted-foreground">Captcha not configured</div>
                  )}
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
                {/* Login captcha (unstyled) */}
                <div className="mt-2">
                  {HCAPTCHA_SITE_KEY ? (
                    <div id="hc-widget-login" />
                  ) : TURNSTILE_SITE_KEY ? (
                    <div id="cf-turnstile-login" />
                  ) : null}
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

      {/* Terms of Service Modal */}
      {showTerms && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="w-[90vw] max-w-lg h-[60vh] bg-card/95 backdrop-blur rounded-xl shadow-2xl p-4 border border-border/50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Terms of Service</h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-muted-foreground hover:text-primary text-sm"
                aria-label="Close terms"
              >
                ×
              </button>
            </div>

            <div
              ref={termsContentRef}
              onScroll={() => {
                const el = termsContentRef.current;
                if (!el) return;
                const { scrollTop, scrollHeight, clientHeight } = el;
                if (scrollTop + clientHeight >= scrollHeight - 8) {
                  setTermsScrolledEnd(true);
                }
              }}
              className="text-xs text-muted-foreground space-y-3 mb-2 overflow-auto flex-1 pr-2"
            >
              <p><strong>1. Acceptance of Terms</strong><br/>By creating an account or using Nairox9ja, you agree to comply with these Terms of Service and all applicable policies of the platform.</p>

              <p><strong>2. Communication Consent</strong><br/>By signing up on Nairox9ja, you agree to receive important notifications, updates, promotional messages, and account-related information through Email, SMS/Text Messages, Telegram or other official communication channels. You may unsubscribe from promotional messages at any time, but important account and security notifications may still be sent when necessary.</p>

              <p><strong>3. Account Responsibility</strong><br/>Users are responsible for keeping their account information accurate and secure. Sharing account credentials with others is at the user’s own risk. Nairox9ja will not be responsible for losses resulting from unauthorized access caused by negligence or sharing of login details.</p>

              <p><strong>4. Platform Integrity</strong><br/>Any attempt to create multiple accounts, use fake information, abuse referral systems, manipulate rewards or tasks, engage in fraudulent activities may result in account restriction, suspension, or permanent termination.</p>

              <p><strong>5. Rewards and Earnings</strong><br/>Rewards, bonuses, and earnings on Nairox9ja are subject to the platform’s rules and requirements. The platform reserves the right to modify reward structures, promotional offers, or earning methods when necessary to improve user experience and platform sustainability.</p>

              <p><strong>6. Privacy and Data Protection</strong><br/>Your personal information is handled with care and used only for Account management, Payment processing, Security verification, Communication and support, Improving our services. Nairox9ja does not sell users’ personal information to third parties.</p>

              <p><strong>7. Trust and Transparency</strong><br/>By registering on this platform, you acknowledge that you understand the platform rules and agree to use the services responsibly and honestly.</p>

              <p><strong>8. Changes to Terms</strong><br/>Nairox9ja reserves the right to update or modify these Terms of Service at any time. Users will be notified of significant changes through official channels or notifications on the platform.</p>
            </div>

            <div className="flex gap-3 justify-end mt-3">
              {!termsScrolledEnd ? (
                <div className="text-xs text-muted-foreground">Scroll to the end to accept</div>
              ) : null}

              {termsScrolledEnd && (
                <>
                  <button
                    onClick={() => { setTermsAccepted(false); setShowTerms(false); setTermsScrolledEnd(false); }}
                    className="px-4 py-2 rounded-md border border-border/40 text-sm text-muted-foreground bg-transparent"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => { setTermsAccepted(true); setShowTerms(false); setTermsScrolledEnd(false); }}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-primary to-secondary text-white text-sm"
                  >
                    Agree
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;