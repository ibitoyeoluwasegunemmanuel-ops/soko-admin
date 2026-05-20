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
import { Services } from "./pages/services/Services";
import { Businesses } from "./pages/businesses/Businesses";
import { Subscriptions } from "./pages/subscriptions/Subscriptions";
import { Ads } from "./pages/ads/Ads";
import { GiftGallery } from "./pages/gift-gallery/GiftGallery";
import { Verification } from "./pages/verification/Verification";
import { AISettings } from "./pages/ai-settings/AISettings";
import { Analytics } from "./pages/analytics/Analytics";
import { Notifications } from "./pages/notifications/Notifications";

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
        <Route path="/services" element={<Services />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wallet" element={<WalletPayments />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/coins-gifts" element={<CoinsGifts />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/ads" element={<Ads />} />
        <Route path="/league" element={<League />} />
        <Route path="/gift-gallery" element={<GiftGallery />} />
        <Route path="/moderation" element={<Moderation />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/ai-settings" element={<AISettings />} />
        <Route path="/feature-flags" element={<FeatureFlags />} />
        <Route path="/settings" element={<AppSettings />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
