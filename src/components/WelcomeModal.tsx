import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  userId?: string | null;
}

export const WelcomeModal = ({ userId }: WelcomeModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"initial" | "verification">("initial");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `welcome_modal_last_shown_${userId}`;
    const lastShownTime = localStorage.getItem(storageKey);
    const now = Date.now();
    const lastShown = lastShownTime ? parseInt(lastShownTime, 10) : 0;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    if (!lastShownTime || now - lastShown >= TWENTY_FOUR_HOURS_MS) {
      localStorage.setItem(storageKey, now.toString());
      setIsOpen(true);
      setStep("initial");
    }
  }, [userId]);

  const handleJoinTelegram = () => {
    if (step === "initial") {
      // Open Telegram link in a new tab (not same tab)
      window.open("https://t.me/Nairox9janews");
      
      // Show loading screen for 5 seconds to prevent evasion
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep("verification");
      }, 5000);
    } else if (step === "verification") {
      const storageKey = userId
        ? `welcome_modal_last_shown_${userId}`
        : "welcome_modal_last_shown";

      localStorage.setItem(storageKey, Date.now().toString());
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Loading overlay - appears after user clicks join, blocks interaction */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium">Redirecting to Telegram...</p>
          </div>
        </div>
      )}

      <Dialog open={isOpen && !isLoading} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          hideCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {step === "initial" ? "Welcome to Nairox9ja ! 🎉" : "Verification Needed"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-lg">
              {step === "initial"
                ? "Join our Telegram channel for exclusive updates, tips, and support! 🚀✨"
                : "Couldn't be verified. Join our Telegram channel to continue."}
            </p>
            {step === "initial" && (
              <p className="text-center text-muted-foreground">
                Get instant notifications about new features and earn extra rewards! 💰🔥
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={handleJoinTelegram}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === "initial" ? "Join Telegram Channel 📢" : "Verify & Continue"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
