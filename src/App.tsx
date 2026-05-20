import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/overview/Overview";
import { Users } from "./pages/users/Users";
import { Creators } from "./pages/creators/Creators";
import { LiveManagement } from "./pages/live/LiveManagement";
import { Marketplace } from "./pages/marketplace/Marketplace";
import { Orders } from "./pages/orders/Orders";
import { WalletPayments } from "./pages/wallet/WalletPayments";
import { Payouts } from "./pages/payouts/Payouts";
import { CoinsGifts } from "./pages/gifts/CoinsGifts";
import { Moderation } from "./pages/moderation/Moderation";
import { FeatureFlags } from "./pages/feature-flags/FeatureFlags";
import { AppSettings } from "./pages/settings/AppSettings";
import { SystemLogs } from "./pages/logs/SystemLogs";
import { Auctions } from "./pages/auctions/Auctions";
import { League } from "./pages/league/League";

// Stub pages
import { PageHeader } from "./components/PageHeader";

function Stub({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <PageHeader title={title} sub={sub ?? "Coming soon"} />
      <div className="flex items-center justify-center py-24 text-white/20 text-sm">
        This section is being built
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/users" element={<Users />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/live" element={<LiveManagement />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/services" element={<Stub title="Services" />} />
        <Route path="/businesses" element={<Stub title="Businesses" />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wallet" element={<WalletPayments />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/coins-gifts" element={<CoinsGifts />} />
        <Route path="/subscriptions" element={<Stub title="Subscriptions" />} />
        <Route path="/ads" element={<Stub title="Ads & Promotions" />} />
        <Route path="/league" element={<League />} />
        <Route path="/gift-gallery" element={<Stub title="Gift Gallery" />} />
        <Route path="/moderation" element={<Moderation />} />
        <Route path="/verification" element={<Stub title="Verification" />} />
        <Route path="/ai-settings" element={<Stub title="AI Settings" />} />
        <Route path="/feature-flags" element={<FeatureFlags />} />
        <Route path="/settings" element={<AppSettings />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/analytics" element={<Stub title="Analytics" />} />
        <Route path="/notifications" element={<Stub title="Notifications" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
