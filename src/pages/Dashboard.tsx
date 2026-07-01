import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Copy, Gift, DollarSign, CheckCircle2, History, Disc3, Wallet, Shield, TrendingUp, Users, Home, Gamepad2, User, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ArrowRight } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";
import { WithdrawalNotification } from "@/components/WithdrawalNotification";
import { AddBalanceModal } from "@/components/AddBalanceModal";
import WithdrawalNoticeModal from "@/components/WithdrawalNoticeModal";
import { Link } from "react-router-dom";

const testimonialsList = [
  { stars: 5, quote: "This website changed my life! I earned ₦3,450,000 in my first month just by following the simple steps. From a broke corper to financially free.", name: "Chisom Okonkwo", location: "Lagos, Nigeria" },
  { stars: 5, quote: "I was skeptical at first, but after 3 weeks I made over ₦1,200,000. The best part? It works while I sleep. Passive income at its finest!", name: "Tunde Adeyemi", location: "Abuja, Nigeria" },
  { stars: 4, quote: "As a single mum, this has been a game-changer. Earned ₦890,000 last month working only 2 hours a day. Finally can afford extras for my kids.", name: "Ngozi Eze", location: "Port Harcourt, Nigeria" },
  { stars: 5, quote: "Made ₦7,650,000 in 45 days. I quit my 9–5 last week. The community and tools are unmatched.", name: "Emeka Nwosu", location: "Kano, Nigeria" },
  { stars: 5, quote: "Retired teacher here. This platform gave me purpose again and ₦2,340,000 extra per month. Love it!", name: "Mama Blessing Adewale", location: "Ibadan, Nigeria" },
  { stars: 5, quote: "From zero to ₦4,200,000 in 6 weeks. The step-by-step guides are so easy even my grandma could follow.", name: "Kunle Afolabi", location: "Enugu, Nigeria" },
  { stars: 4, quote: "Earned my first ₦500,000 in under 10 days. Now consistently pulling ₦1,800,000–₦2,500,000 monthly.", name: "Adaeze Okafor", location: "Benin City, Nigeria" },
  { stars: 5, quote: "I love how beginner-friendly it is. Made ₦9,100,000 so far and I'm only 19!", name: "Seun Balogun", location: "Warri, Nigeria" },
  { stars: 5, quote: "Best decision ever. Replaced my salary (₦4,800,000/month) and now travel full-time.", name: "Zainab Musa", location: "Calabar, Nigeria" },
  { stars: 4, quote: "As a truck driver, I do this on the road. Already banked ₦3,670,000 in passive earnings.", name: "Chukwudi Ogbuike", location: "Owerri, Nigeria" },
  { stars: 5, quote: "Turned my passion into ₦2,890,000/month. Can't thank the team enough!", name: "Ifunanya Chukwu", location: "Jos, Nigeria" },
  { stars: 5, quote: "My side hustle exploded to ₦6,200,000 last month. Finally debt-free!", name: "Fatima Usman", location: "Kaduna, Nigeria" },
  { stars: 4, quote: "Consistent ₦1,100,000–₦1,600,000 every single month. Super reliable.", name: "Rotimi Adesanya", location: "Abeokuta, Nigeria" },
  { stars: 5, quote: "Earned ₦12,450,000 in 3 months. This is the real deal.", name: "Aisha Garba", location: "Sokoto, Nigeria" },
  { stars: 5, quote: "From unemployed to making ₦2,750,000/month from home. Mind blown.", name: "Uche Nnamdi", location: "Akure, Nigeria" },
  { stars: 4, quote: "Great for beginners. I made ₦780,000 in week one!", name: "Chiamaka Obiora", location: "Makurdi, Nigeria" },
  { stars: 5, quote: "The support is incredible. Hit ₦5,340,000 and still growing strong.", name: "Babatunde Olawale", location: "Lagos, Nigeria" },
  { stars: 5, quote: "Quit my corporate job after earning ₦8,900,000 in two months. Freedom!", name: "Amira Suleiman", location: "Abuja, Nigeria" },
  { stars: 4, quote: "Low effort, high reward. Averaging ₦2,100,000 monthly now.", name: "Nnamdi Obi", location: "Port Harcourt, Nigeria" },
  { stars: 5, quote: "Made ₦1,450,000 while on vacation in Zanzibar. Truly location independent.", name: "Halima Yakubu", location: "Kano, Nigeria" },
  { stars: 5, quote: "Started with nothing, now earning ₦4,500,000 monthly. This platform is gold!", name: "Obiora Chukwuemeka", location: "Ibadan, Nigeria" },
  { stars: 4, quote: "As a freelancer, this doubled my income to ₦3,200,000 per month.", name: "Bukola Fashola", location: "Enugu, Nigeria" },
  { stars: 5, quote: "Earned ₦6,800,000 in 2 months. Life-changing opportunity!", name: "Damilola Ogundimu", location: "Benin City, Nigeria" },
  { stars: 5, quote: "From part-time to full-time earner: ₦5,100,000 monthly now.", name: "Yetunde Adebayo", location: "Warri, Nigeria" },
  { stars: 4, quote: "Consistent ₦1,900,000 every month. Perfect for busy parents.", name: "Chidi Okeke", location: "Calabar, Nigeria" },
  { stars: 5, quote: "Made ₦10,200,000 in 4 months. Unbelievable results!", name: "Funmi Adeleke", location: "Owerri, Nigeria" },
  { stars: 5, quote: "Passive income dream: ₦3,750,000 while I travel the world.", name: "Tosin Ajayi", location: "Jos, Nigeria" },
  { stars: 4, quote: "Beginner-friendly and profitable. Earned ₦950,000 in first week.", name: "Oluwaseun Oladele", location: "Kaduna, Nigeria" },
  { stars: 5, quote: "Replaced my job income with ₦7,300,000 monthly earnings.", name: "Nneka Ihejirika", location: "Abeokuta, Nigeria" },
  { stars: 5, quote: "As a student, this gave me financial freedom: ₦2,600,000/month.", name: "Abdullahi Bello", location: "Sokoto, Nigeria" },
  { stars: 4, quote: "Low-risk, high-reward. Averaging ₦4,100,000 monthly.", name: "Chidinma Ibe", location: "Akure, Nigeria" },
  { stars: 5, quote: "Earned ₦8,500,000 in 3 months. The community is amazing!", name: "Segun Oluwole", location: "Makurdi, Nigeria" },
  { stars: 5, quote: "From doubter to believer: ₦5,800,000 in passive income.", name: "Mariam Aliyu", location: "Lagos, Nigeria" },
  { stars: 4, quote: "Consistent ₦2,300,000–₦3,000,000 every single month.", name: "Chukwuebuka Osei", location: "Abuja, Nigeria" },
  { stars: 5, quote: "Made ₦9,750,000 in 5 months. This is revolutionary!", name: "Ifeoma Nwofor", location: "Port Harcourt, Nigeria" },
  { stars: 5, quote: "Quit my dead-end job after earning ₦4,200,000/month.", name: "Ayo Oluwasegun", location: "Kano, Nigeria" },
  { stars: 4, quote: "Perfect for side income. Made ₦1,150,000 in week one!", name: "Stella Ogwu", location: "Ibadan, Nigeria" },
  { stars: 5, quote: "The tools are incredible. Hit ₦6,900,000 and counting.", name: "Emeka Okafor", location: "Enugu, Nigeria" },
  { stars: 5, quote: "Financial independence achieved: ₦11,200,000 in two months.", name: "Adaora Nze", location: "Benin City, Nigeria" },
  { stars: 4, quote: "Easy to use and profitable. Averaging ₦3,400,000 monthly.", name: "Sola Adeyemi", location: "Warri, Nigeria" },
  { stars: 5, quote: "Made ₦2,800,000 while on a family trip to Dubai. Amazing!", name: "Bimpe Olanrewaju", location: "Calabar, Nigeria" },
  { stars: 5, quote: "Started small, now earning ₦7,100,000 monthly. So grateful!", name: "Usman Danladi", location: "Owerri, Nigeria" },
  { stars: 4, quote: "As a retiree, this provides ₦3,900,000 extra per month.", name: "Mama Ngozi Aniemena", location: "Jos, Nigeria" },
  { stars: 5, quote: "Earned ₦8,300,000 in 3 months. Best investment ever!", name: "Kehinde Akinola", location: "Kaduna, Nigeria" },
  { stars: 5, quote: "From zero to ₦5,500,000 in 6 weeks. Unstoppable!", name: "Oluwakemi Fasanya", location: "Abeokuta, Nigeria" },
  { stars: 4, quote: "Reliable income stream: ₦2,700,000–₦3,500,000 monthly.", name: "Ikechukwu Igwe", location: "Sokoto, Nigeria" },
  { stars: 5, quote: "Made ₦12,800,000 in 4 months. Life transformed!", name: "Adesola Olawuyi", location: "Akure, Nigeria" },
  { stars: 5, quote: "Passive earnings of ₦4,600,000 while chasing my dreams.", name: "Olumide Adewale", location: "Makurdi, Nigeria" },
  { stars: 4, quote: "Beginner success: ₦1,200,000 in first week. Loving it!", name: "Chinwe Okonkwo", location: "Lagos, Nigeria" },
  { stars: 5, quote: "Replaced full-time salary with ₦9,400,000 monthly income.", name: "Maryam Ibrahim", location: "Abuja, Nigeria" },
  { stars: 5, quote: "As a young professional, earning ₦3,100,000/month is freedom.", name: "Femi Adesola", location: "Port Harcourt, Nigeria" },
  { stars: 4, quote: "Low-effort high-reward: ₦4,800,000 monthly average.", name: "Ngozi Okorie", location: "Kano, Nigeria" },
  { stars: 5, quote: "Earned ₦10,600,000 in 3 months. The support is top-notch!", name: "Wale Adeyemi", location: "Ibadan, Nigeria" },
  { stars: 5, quote: "From doubt to ₦6,400,000 in passive income. Incredible!", name: "Nadia Hassan", location: "Enugu, Nigeria" },
  { stars: 4, quote: "Steady ₦2,900,000–₦3,800,000 every month. Highly recommend.", name: "Chukwuma Nwachukwu", location: "Benin City, Nigeria" },
  { stars: 5, quote: "Achieved ₦11,900,000 in 5 months. This platform rocks!", name: "Adunola Adeyemi", location: "Warri, Nigeria" },
  { stars: 5, quote: "Left my job for ₦5,300,000/month earnings. Best choice!", name: "Kayode Ogunleye", location: "Calabar, Nigeria" },
  { stars: 4, quote: "Quick start: ₦1,400,000 in week one. Excited for more!", name: "Amaka Eze", location: "Owerri, Nigeria" },
  { stars: 5, quote: "Tools and community led to ₦7,500,000 monthly success.", name: "Emmanuel Ugwu", location: "Jos, Nigeria" },
  { stars: 5, quote: "Financial freedom: ₦13,100,000 in two months. Thank you!", name: "Hauwa Abdullahi", location: "Kaduna, Nigeria" },
  { stars: 4, quote: "Effortless earnings: ₦3,700,000 monthly average.", name: "Kunle Bakare", location: "Abeokuta, Nigeria" },
  { stars: 5, quote: "Made ₦3,200,000 during my honeymoon. Truly flexible!", name: "Dupe Owolade", location: "Sokoto, Nigeria" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("Ready!");
  const [showWithdrawalNotice, setShowWithdrawalNotice] = useState(false);
  const [cardAnimation, setCardAnimation] = useState("pop");
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Cycle through random testimonials with animations
  useEffect(() => {
    const animations = ["pop", "burst", "ripple", "tear"];
    const interval = setInterval(() => {
      setCardAnimation(animations[Math.floor(Math.random() * animations.length)]);
      setCurrentTestimonialIndex(Math.floor(Math.random() * testimonialsList.length));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (lastClaimTime) {
      const updateCountdown = () => {
        const timeDiff = Date.now() - lastClaimTime.getTime();
        const canClaimNow = timeDiff >= 5 * 60 * 1000; // 5 minutes
        
        if (canClaimNow) {
          setTimeRemaining("Ready!");
          setCanClaim(true);
        } else {
          const remainingTime = 5 * 60 * 1000 - timeDiff;
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.floor((remainingTime % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          setCanClaim(false);
        }
      };

      // Update immediately
      updateCountdown();

      // Then set interval for continuous updates
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [lastClaimTime]);

  useEffect(() => {
    // Listen for balance updates from other pages (e.g., Tasks page)
    const handleBalanceUpdate = (event: any) => {
      console.log('Balance updated event received:', event.detail);
      if (user) {
        loadProfile(user.id);
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdated', handleBalanceUpdate);
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setTimeout(() => navigate("/auth"), 100);
    } else {
      setUser(session.user);
      loadProfile(session.user.id);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);

      const { data: claims } = await supabase
        .from("claims")
        .select("*")
        .eq("user_id", userId)
        .order("claimed_at", { ascending: false })
        .limit(1);

      if (claims && claims.length > 0) {
        const lastClaim = new Date(claims[0].claimed_at);
        setLastClaimTime(lastClaim);
        const timeDiff = Date.now() - lastClaim.getTime();
        setCanClaim(timeDiff >= 5 * 60 * 1000);
      } else {
        setCanClaim(true);
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${profile.referral_code}`);
      toast.success("Referral link copied!");
    }
  };

  const handleClaim = async () => {
    if (!canClaim || claiming) return;

    setClaiming(true);
    try {
      const { error: claimError } = await supabase
        .from("claims")
        .insert({ user_id: user.id, amount: 5000 });

      if (claimError) throw claimError;

      const newBalance = (profile?.balance || 0) + 5000;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "credit",
          amount: 5000,
          description: "Mini claim bonus",
          status: "completed",
        });

      toast.success("₦5,000 claimed successfully!");
      setLastClaimTime(new Date());
      setCanClaim(false);
      await loadProfile(user.id);
    } catch (error: any) {
      toast.error("Failed to claim bonus");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div
      className="min-h-screen liquid-bg pb-20 relative"
      style={{ position: "relative", zIndex: 1 }}
    >
      <WelcomeModal userId={user?.id} />
      <WithdrawalNotification />

      {/* WITHDRAWAL NOTICE MODAL */}
      {showWithdrawalNotice && (
        <WithdrawalNoticeModal
          onContinue={() => {
            setShowWithdrawalNotice(false);
            navigate("/withdraw");
          }}
          onCancel={() => setShowWithdrawalNotice(false)}
        />
      )}

      {/* Header */}
      <div
        className="bg-gradient-to-r from-primary to-secondary p-4 text-primary-foreground glow-primary"
        style={{ pointerEvents: "auto", position: "relative", zIndex: 2 }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Greeting */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-lg flex items-center justify-center text-lg font-bold flex-shrink-0">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs opacity-90">Hi, {profile.full_name} 👋</p>
              <p className="text-sm font-semibold">Welcome back!</p>
            </div>
          </div>

          {/* Right: Telegram Support Button */}
          <Button
            onClick={() =>
              window.open(" https://t.me/Nairox9jaCustomercarebot", "_self")
            }
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20 flex items-center gap-2 py-2 px-3 h-auto rounded-lg transition-all duration-200 flex-shrink-0 whitespace-nowrap text-xs font-medium"
          >
            <Send className="w-4 h-4" />
            Support
          </Button>
        </div>
      </div>

      <div
        className="space-y-4 py-4"
        style={{ position: "relative", zIndex: 2, pointerEvents: "auto" }}
      >
        {/* Balance Card - NOW WITH CLAIM BUTTON INSTEAD OF TOP UP */}
        <div className="px-4">
          <Card className="bg-gradient-to-br from-card to-card/80 backdrop-blur-lg border-border/50 p-4 glow-primary animate-fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="hover:bg-muted h-8 w-8"
                >
                  {showBalance ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold gradient-text">
                {showBalance
                  ? `₦${Number(profile.balance || 0).toLocaleString()}.00`
                  : "****"}
              </h2>
              {/* CLAIM BUTTON REPLACES TOP UP BUTTON */}
              <Button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-sm py-2"
              >
                {claiming
                  ? "Claiming..."
                  : canClaim
                    ? "Claim ₦5,000"
                    : timeRemaining}
              </Button>
            </div>
          </Card>
        </div>

        {/* Mini Card - Upgrade CTA */}
        <div className="px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Shield className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-foreground">
                    Upgrade Account
                  </p>
                  <p className="text-muted-foreground truncate">
                    Unlock higher earnings and faster withdrawals
                  </p>
                </div>
              </div>
              {/* UPGRADE BUTTON */}
              <Button
                onClick={() => navigate("/upgrade")}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-xs px-3 py-1 h-auto flex-shrink-0"
              >
                Upgrade
              </Button>
            </div>
          </Card>
        </div>

        {/* View Testimonials Link */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => navigate("/testimonials")}
            className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline py-2"
          >
            View Testimonials <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/referrals")}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">💰 Refer & Earn.</span>
            </button>
            <button
              type="button"
              onClick={() => setShowWithdrawalNotice(true)}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <DollarSign className="w-5 h-5 text-secondary" />
              <span className="text-xs font-semibold">💸 Withdraw</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-xs font-semibold">✅ Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <History className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-semibold">📜 History</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Disc3 className="w-5 h-5 text-accent" />
              <span className="text-xs font-semibold">ℹ️ About</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              className="h-20 flex flex-col gap-1.5 items-center justify-center rounded-lg border bg-card/80 hover:bg-card border-border/50 transition-all active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">💳 Wallet</span>
            </button>
          </div>
        </div>

        {/* Referral Card */}
        <div className="px-4">
          <Card className="bg-card/80 backdrop-blur-lg border-border/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Referral Program</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Referrals
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {profile.total_referrals || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Earnings/Referral
                  </p>
                  <p className="text-xl font-bold text-secondary">₦10,000</p>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Your Referral Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[10px] font-bold text-foreground truncate">
                    {window.location.origin}/auth?ref={profile.referral_code}
                  </code>
                  <Button
                    size="sm"
                    onClick={copyReferralCode}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex-shrink-0 h-7 w-7 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Why Tivexx9ja Section */}
        <div className="mt-6">
          <div className="why-glow bg-gradient-to-br from-black via-green-950 to-black rounded-2xl p-6 mb-6 mx-2 border border-green-500/30 relative overflow-hidden">
            <div className="text-center mb-4 relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">
                Testimonials
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-yellow-400 mx-auto mb-4"></div>
            </div>

            <div className="space-y-4 mb-6 relative z-10">
              <div 
                className="rounded-3xl border border-white/10 bg-white/5 p-5 min-h-[220px] testimonial-card"
                style={{
                  animation: cardAnimation === 'pop' 
                    ? `popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
                    : cardAnimation === 'burst'
                    ? 'burst 0.6s ease-in-out infinite'
                    : cardAnimation === 'ripple'
                    ? 'ripple 1.2s ease-in-out infinite'
                    : 'tearShift 1.5s ease-in-out infinite'
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-green-300 font-semibold">
                      Testimonial Preview
                    </p>
                    <h3 className="text-lg font-semibold text-white mt-3">
                      "{testimonialsList[currentTestimonialIndex].quote}"
                    </h3>
                  </div>
                  <div className="text-yellow-400 text-base font-bold tracking-wide">
                    {'★'.repeat(testimonialsList[currentTestimonialIndex].stars)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-950/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-green-300">
                      User
                    </p>
                    <p className="font-semibold text-white">{testimonialsList[currentTestimonialIndex].name}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-green-300">
                      Location
                    </p>
                    <p className="font-semibold text-white">{testimonialsList[currentTestimonialIndex].location}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-green-200">
                  A real earning preview from a member who unlocked success — all from one simple system.
                </p>
              </div>
            </div>

            <Link to="/testimonials">
              <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-3 rounded-full text-lg">
                View more testimonial
              </Button>
            </Link>
          </div>
        </div>

        {/* Custom Styles for Glow Effect */}
        <style jsx global>{`
          @keyframes bounce-slow {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
          }
          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }

          @keyframes glow-swipe {
            0% {
              opacity: 0.7;
              transform: translateX(-10%);
              filter: blur(10px);
            }
            50% {
              opacity: 1;
              transform: translateX(10%);
              filter: blur(18px);
            }
            100% {
              opacity: 0.7;
              transform: translateX(-10%);
              filter: blur(10px);
            }
          }

          @keyframes shimmer {
            0% {
              left: -120%;
            }
            50% {
              left: 120%;
            }
            100% {
              left: -120%;
            }
          }

          @keyframes popIn {
            0% {
              transform: scale(0.8) translate3d(0, 0, 0);
              opacity: 0;
              filter: blur(8px);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
            }
            100% {
              transform: scale(1);
              opacity: 1;
              filter: blur(0px);
            }
          }

          @keyframes burst {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0px rgba(34, 197, 94, 0);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 40px rgba(255, 193, 7, 0.8), 0 0 60px rgba(34, 197, 94, 0.4);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
            }
          }

          @keyframes ripple {
            0% {
              box-shadow: 0 0 0px 0px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.2);
            }
            50% {
              box-shadow: 0 0 0px 20px rgba(34, 197, 94, 0), 0 0 40px rgba(34, 197, 94, 0.6);
            }
            100% {
              box-shadow: 0 0 0px 0px rgba(34, 197, 94, 0), 0 0 20px rgba(34, 197, 94, 0.2);
            }
          }

          @keyframes tearShift {
            0% {
              transform: translateY(0) skewY(0deg);
              opacity: 1;
              filter: blur(0px);
            }
            25% {
              transform: translateY(-4px) skewY(1deg);
              opacity: 0.95;
            }
            50% {
              transform: translateY(0) skewY(-1deg);
              opacity: 0.98;
            }
            75% {
              transform: translateY(-2px) skewY(0.5deg);
            }
            100% {
              transform: translateY(0) skewY(0deg);
              opacity: 1;
            }
          }

          .testimonial-card {
            transition: all 0.3s ease;
            will-change: transform, box-shadow, filter;
          }

          .why-glow {
            position: relative;
            overflow: hidden;
          }

          .why-glow::before {
            content: "";
            position: absolute;
            top: -25%;
            left: -25%;
            width: 150%;
            height: 150%;
            background:
              radial-gradient(
                circle at 20% 20%,
                rgba(34, 197, 94, 0.1),
                transparent 8%
              ),
              radial-gradient(
                circle at 80% 80%,
                rgba(96, 165, 250, 0.05),
                transparent 10%
              );
            filter: blur(22px);
            transform: translate3d(0, 0, 0);
            animation: glow-swipe 6s linear infinite;
            pointer-events: none;
          }

          .why-glow::after {
            content: "";
            position: absolute;
            top: -10%;
            left: -120%;
            width: 60%;
            height: 120%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.08) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-20deg);
            filter: blur(6px);
            animation: shimmer 3.5s ease-in-out infinite;
            pointer-events: none;
          }

          .why-glow > * {
            position: relative;
            z-index: 1;
          }
        `}</style>
      </div>

      <FloatingActionButton />

      <AddBalanceModal
        open={showTopUp}
        onOpenChange={setShowTopUp}
        onSuccess={() => {
          if (user) loadProfile(user.id);
        }}
      />
    </div>
  );
};

export default Dashboard;