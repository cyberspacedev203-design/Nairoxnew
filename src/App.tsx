import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Referrals from "./pages/Referrals";
import Profile from "./pages/Profile";
import Withdraw from "./pages/Withdraw";
import Upgrade from "./pages/Upgrade";
import UpgradePayment from "./pages/UpgradePayment";
import UpgradePending from "./pages/UpgradePending";
import GatewayActivation from "./pages/GatewayActivation";
import GatewayPending from "./pages/GatewayPending";
import WithdrawalActivation from "./pages/WithdrawalActivation";
import InstantWithdrawalActivation from "./pages/InstantWithdrawalActivation";
import InstantWithdrawalPending from "./pages/InstantWithdrawalPending";
import WithdrawalActivationPending from "./pages/WithdrawalActivationPending";
import Tasks from "./pages/Tasks";
import Support from "./pages/Support";
import Community from "./pages/Community";
import Spin from "./pages/Spin";
import About from "./pages/About";
import Broadcast from "./pages/Broadcast";
import WalletDetails from "./pages/WalletDetails";
import NotFound from "./pages/NotFound";
import Testimonials from "./pages/Testimonials";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/upgrade-payment" element={<UpgradePayment />} />
          <Route path="/upgrade-pending" element={<UpgradePending />} />
          <Route path="/gateway-activation" element={<GatewayActivation />} />
          <Route path="/gateway-pending" element={<GatewayPending />} />
          <Route path="/withdrawal-activation" element={<WithdrawalActivation />} />
          <Route path="/instant-withdrawal-activation" element={<InstantWithdrawalActivation />} />
          <Route path="/instant-withdrawal-pending" element={<InstantWithdrawalPending />} />
          <Route path="/withdrawal-activation-pending" element={<WithdrawalActivationPending />} />
          <Route path="/wallet" element={<WalletDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/support" element={<Support />} />
          <Route path="/community" element={<Community />} />
          <Route path="/spin" element={<Spin />} />
          <Route path="/about" element={<About />} />
          <Route path="/broadcast" element={<Broadcast />} />
          <Route path="/testimonials" element={<Testimonials />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
