import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/overview/Overview";
import { Users } from "./pages/users/Users";
import { Creators } from "./pages/creators/Creators";
import { LiveManagement } from "./pages/live/LiveManagement";
import { Marketplace } from "./pages/marketplace/Marketplace";
import { Products } from "./pages/products/Products";
import { Services } from "./pages/services/Services";
import { Businesses } from "./pages/businesses/Businesses";
import { Professionals } from "./pages/professionals/Professionals";
import { Auctions } from "./pages/auctions/Auctions";
import { Orders } from "./pages/orders/Orders";
import { WalletPayments } from "./pages/wallet/WalletPayments";
import { Payouts } from "./pages/payouts/Payouts";
import { CoinsGifts } from "./pages/gifts/CoinsGifts";
import { Subscriptions } from "./pages/subscriptions/Subscriptions";
import { Ads } from "./pages/ads/Ads";
import { League } from "./pages/league/League";
import { GiftGallery } from "./pages/gift-gallery/GiftGallery";
import { Campaigns } from "./pages/campaigns/Campaigns";
import { SupportCenter } from "./pages/support/SupportCenter";
import { ContentManagement } from "./pages/cms/ContentManagement";
import { Moderation } from "./pages/moderation/Moderation";
import { Verification } from "./pages/verification/Verification";
import { FraudRisk } from "./pages/fraud/FraudRisk";
import { Compliance } from "./pages/compliance/Compliance";
import { AISettings } from "./pages/ai-settings/AISettings";
import { TeamManagement } from "./pages/team/TeamManagement";
import { DeveloperTools } from "./pages/developer/DeveloperTools";
import { PlatformHealth } from "./pages/health/PlatformHealth";
import { FeatureFlags } from "./pages/feature-flags/FeatureFlags";
import { AppSettings } from "./pages/settings/AppSettings";
import { Analytics } from "./pages/analytics/Analytics";
import { RevenueIntelligence } from "./pages/revenue/RevenueIntelligence";
import { SystemLogs } from "./pages/logs/SystemLogs";
import { AffiliateMarketing } from "./pages/affiliate/AffiliateMarketing";
import { LogisticsPartners } from "./pages/logistics/LogisticsPartners";
import { ProductVariants } from "./pages/variants/ProductVariants";
import { TwoFactorAuth } from "./pages/two-factor/TwoFactorAuth";
import { CreatorAnalytics } from "./pages/creators/CreatorAnalytics";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        {/* Main Menu */}
        <Route path="/"                    element={<Overview />} />
        <Route path="/users"               element={<Users />} />
        <Route path="/creators"            element={<Creators />} />
        <Route path="/creator-analytics"   element={<CreatorAnalytics />} />
        <Route path="/analytics"           element={<Analytics />} />
        <Route path="/revenue"             element={<RevenueIntelligence />} />

        {/* Platform */}
        <Route path="/live"            element={<LiveManagement />} />
        <Route path="/marketplace"     element={<Marketplace />} />
        <Route path="/products"        element={<Products />} />
        <Route path="/variants"        element={<ProductVariants />} />
        <Route path="/services"        element={<Services />} />
        <Route path="/businesses"      element={<Businesses />} />
        <Route path="/professionals"   element={<Professionals />} />
        <Route path="/auctions"        element={<Auctions />} />
        <Route path="/orders"          element={<Orders />} />

        {/* Finance */}
        <Route path="/wallet"          element={<WalletPayments />} />
        <Route path="/payouts"         element={<Payouts />} />
        <Route path="/coins-gifts"     element={<CoinsGifts />} />
        <Route path="/subscriptions"   element={<Subscriptions />} />
        <Route path="/ads"             element={<Ads />} />

        {/* Growth */}
        <Route path="/league"          element={<League />} />
        <Route path="/gift-gallery"    element={<GiftGallery />} />
        <Route path="/campaigns"       element={<Campaigns />} />
        <Route path="/affiliate"       element={<AffiliateMarketing />} />
        <Route path="/logistics"       element={<LogisticsPartners />} />

        {/* Engagement */}
        <Route path="/support"         element={<SupportCenter />} />
        <Route path="/cms"             element={<ContentManagement />} />

        {/* Safety */}
        <Route path="/moderation"      element={<Moderation />} />
        <Route path="/verification"    element={<Verification />} />
        <Route path="/fraud"           element={<FraudRisk />} />
        <Route path="/compliance"      element={<Compliance />} />
        <Route path="/two-factor"      element={<TwoFactorAuth />} />
        <Route path="/ai-settings"     element={<AISettings />} />

        {/* Team */}
        <Route path="/team"            element={<TeamManagement />} />

        {/* Developer */}
        <Route path="/developer-tools" element={<DeveloperTools />} />
        <Route path="/platform-health" element={<PlatformHealth />} />
        <Route path="/feature-flags"   element={<FeatureFlags />} />
        <Route path="/settings"        element={<AppSettings />} />
        <Route path="/logs"            element={<SystemLogs />} />

        {/* Removed: /notifications (merged into /campaigns) */}
        <Route path="/notifications"   element={<Navigate to="/campaigns" replace />} />

        <Route path="*"                element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
