import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import RotatingCube from './components/RotatingCube';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import ResourcesPage from './pages/ResourcesPage';
import CasesPage from './pages/CollaborationsPage';
import CollaborationsPage from './pages/CollaborationsPage';
import MembersPage from './components/MembersPage';
import MembersInfinite from './components/MembersInfinite';
import MembersPageGrid from './components/MembersPageGrid';
import MembersPageDaybreak from './components/MembersPageDaybreak';
import MembersDemo from './components/MembersDemo';
import MembersPageSimple from './components/MembersPageSimple';
import MembersPageWhisper from './components/MembersPageWhisper';
import MembersPageWhisperActual from './components/MembersPageWhisperActual';
import { Contact2 } from './components/ui/contact-2';
import ContactPage from './pages/ContactPage';
import TermsConditions from './components/TermsConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQPage from './components/FAQPage';
import WhitepaperPage from './pages/WhitepaperPage';
import MembershipFormPage from './pages/MembershipFormPage';
import Footer from './components/ui/footer';
import { CookieNotice } from './components/ui/cookie-notice';
import MissionPage from './pages/MissionPage';
import TeamPage from './pages/TeamPage';
import TeamPageScattered from './pages/TeamPageScattered';
import TeamPageGlobe from './pages/TeamPageGlobe';
import PartnersPage from './pages/PartnersPage';
import PlaygroundPage from './pages/PlaygroundPage';
import VortexEntry from './components/VortexEntry';
import VortexDemo from './pages/VortexDemo';
import HeroPage from './pages/HeroPage';
import SplashPage from './pages/SplashPage';
import NewsletterPage from './pages/NewsletterPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticlePage from './pages/ArticlePage';
import JobsPage from './pages/JobsPage';
import NetworkDirectoryPage from './pages/NetworkDirectoryPage';
import NetworkCreateProfilePage from './pages/NetworkCreateProfilePage';
import NetworkProfilePage from './pages/NetworkProfilePage';
import NetworkAuthPage from './pages/NetworkAuthPage';
import NetworkDashboardPage from './pages/NetworkDashboardPage';
import NetworkEditProfilePage from './pages/NetworkEditProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HirePage from './pages/HirePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PurchaseCreditsPage from './pages/PurchaseCreditsPage';
import CompanyAuthPage from './pages/CompanyAuthPage';
import CompanyRegisterPage from './pages/CompanyRegisterPage';
import CompanyRequestAccessPage from './pages/CompanyRequestAccessPage';
import CompanyDashboardPage from './pages/CompanyDashboardPage';
import CompanyCTFinderPage from './pages/CompanyTalentAgentPage';
import ChatPage from './pages/ChatPage';
import BetaPage from './pages/BetaPage';
import BetaHubPage from './pages/BetaHubPage';
import BetaAuthPage from './pages/BetaAuthPage';
import BetaAccountSetupPage from './pages/BetaAccountSetupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { usePageTracking } from './hooks/usePageTracking';
import MessageNotification from './components/MessageNotification';
import BetaFeedbackWidget from './components/BetaFeedbackWidget';

// Helper function to get appropriate icon for category/tag
const getCategoryIcon = (name: string): string => {
  const iconMap: { [key: string]: string } = {
    // Categories
    'design': '🎨',
    'dev': '⚡',
    'learning': '📚',
    'media': '🎬',
    'tools': '🛠️',
    'ai': '🤖',
    'audio': '🔊',
    '3d': '📦',
    'cloud': '☁️',
    'api': '🔌',
    'templates': '📋',
    'video': '🎬'
  };
  
  return iconMap[name.toLowerCase()] || '🔖';
};

// Sample data for categories (you can move this to a separate data file)
const sampleLinks = [
  {
    id: '1',
    title: 'WhatsApp MCP',
    description: 'GitHub repo for WhatsApp Message Control Panel (MCP)',
    url: 'https://github.com/lharries/whatsapp-mcp',
    image: '/thumbnails/whatsappmcp.png',
    category: 'dev',
    tags: ['api', 'tools'],
    date: '2025-01'
  },
  // Add more sample links as needed for categories
];

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCubeIcon, setShowCubeIcon] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Track page views on route changes for Google Analytics
  usePageTracking();

  // Intercept Supabase auth hash params on the root page and redirect
  // to the auth callback. Confirmation/magic link emails redirect to site_url
  // which is `/`, but only /auth/callback knows how to process those tokens.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1 || location.pathname !== '/') return;

    const hashParams = new URLSearchParams(hash.substring(1));

    if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
      window.location.replace(`${window.location.origin}/auth/callback${hash}`);
    } else if (hashParams.has('error')) {
      const errorDesc = hashParams.get('error_description') || 'Authentication failed';
      navigate(`/beta/auth?error=${encodeURIComponent(errorDesc)}`, { replace: true });
    }
  }, [location.pathname, navigate]);


  // Handle scroll effects
  useEffect(() => {
    // Only apply scroll effects on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    
    const handleScroll = () => {
      const windowScrollY = window.scrollY || window.pageYOffset;
      const scrollableElement = document.querySelector('.overflow-y-auto');
      const containerScrollY = scrollableElement ? scrollableElement.scrollTop : 0;
      const totalScrollY = Math.max(windowScrollY, containerScrollY);
      
      if (totalScrollY > 10) {
        setShowCubeIcon(false);
      } else if (totalScrollY <= 5) {
        setShowCubeIcon(true);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Only apply on mobile
      if (window.innerWidth >= 768) return;
      
      if (Math.abs(e.deltaY) > 0) {
        if (e.deltaY > 0) {
          setShowCubeIcon(false);
        }
      }
    };

    // Touch events for mobile
    let touchStartY = 0;
    let hasTouchMoved = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      hasTouchMoved = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = Math.abs(touchStartY - touchY);
      
      if (deltaY > 5 && !hasTouchMoved) {
        setShowCubeIcon(false);
        hasTouchMoved = true;
      }
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('wheel', handleWheel, { passive: true });
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      if (isMobile) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [location.pathname]);

  // Reset visibility when changing routes
  useEffect(() => {
    if (location.pathname === '/') {
      // Home page handles its own cube icon visibility
      return;
    } else {
      // All other pages show the cube icon (always visible on desktop)
      setShowCubeIcon(true);
    }
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* Navigation */}
      <Navigation 
        showCubeIcon={showCubeIcon}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Real-time Message Notifications */}
      <MessageNotification />

      {/* Beta Feedback Widget - bottom right on all pages for logged-in users */}
      <BetaFeedbackWidget />

      {/* Main Content */}
      <main className={`flex-1 pt-[72px]`}>
        <div>
          <Routes>
            <Route 
              path="/" 
              element={<HeroPage />} 
            />
            <Route 
              path="/home" 
              element={<Navigate to="/" replace />} 
            />
            <Route 
              path="/mission" 
              element={
                <MissionPage />
              } 
            />
            <Route 
              path="/playground" 
              element={
                <div className="w-full">
                  <PlaygroundPage />
                </div>
              } 
            />
            <Route 
              path="/resources" 
              element={
                <div className="w-full">
                  <ResourcesPage />
                </div>
              } 
            />
            <Route 
              path="/members-grid" 
              element={
                <div className="fixed inset-0">
                  <MembersPageGrid />
                </div>
              } 
            />
            <Route 
              path="/members-daybreak" 
              element={
                <div className="fixed inset-0">
                  <MembersPageDaybreak />
                </div>
              } 
            />
            <Route 
              path="/members-demo" 
              element={
                <div className="fixed inset-0">
                  <MembersDemo />
                </div>
              } 
            />
            <Route 
              path="/members-simple" 
              element={
                <div className="fixed inset-0">
                  <MembersPageSimple />
                </div>
              } 
            />
            <Route 
              path="/members-whisper" 
              element={
                <div className="fixed inset-0">
                  <MembersPageWhisperActual />
                </div>
              } 
            />
           
            <Route 
              path="/collaborations" 
              element={
                <div className="w-full">
                  <CollaborationsPage />
                </div>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <div className="w-full">
                  <ContactPage />
                </div>
              } 
            />
            <Route 
              path="/terms" 
              element={
                <div className="w-full">
                  <TermsConditions />
                </div>
              } 
            />
            <Route 
              path="/privacy" 
              element={
                <div className="w-full">
                  <PrivacyPolicy />
                </div>
              } 
            />
            <Route 
              path="/terms-and-conditions" 
              element={
                <div className="w-full">
                  <TermsConditions />
                </div>
              } 
            />
            <Route 
              path="/privacy-policy" 
              element={
                <div className="w-full">
                  <PrivacyPolicy />
                </div>
              } 
            />
            <Route 
              path="/faq" 
              element={
                <div className="w-full">
                  <FAQPage />
                </div>
              } 
            />
            {/* Dynamic whitepaper routes */}
            <Route 
              path="/whitepaper" 
              element={
                <div className="w-full">
                  <WhitepaperPage />
                </div>
              } 
            />
            <Route 
              path="/whitepaper/*" 
              element={
                <div className="w-full">
                  <WhitepaperPage />
                </div>
              } 
            />
                        <Route 
              path="/membership-form" 
              element={
                <div className="w-full">
                  <MembershipFormPage />
                </div>
              } 
            />
            <Route 
              path="/team" 
              element={
                <div className="w-full">
                  <TeamPage />
                </div>
              } 
            />
            <Route 
              path="/team-scattered" 
              element={<TeamPageScattered />} 
            />
            <Route 
              path="/team-globe" 
              element={<TeamPageGlobe />} 
            />
            <Route 
              path="/partners" 
              element={
                <div className="w-full">
                  <PartnersPage />
                </div>
              } 
            />
            <Route 
              path="/vortex-demo" 
              element={<VortexDemo />} 
            />
            <Route 
              path="/newsletter" 
              element={
                <div className="w-full">
                  <NewsletterPage />
                </div>
              } 
            />
            {/* Hidden Articles routes - accessible via direct URL */}
            <Route 
              path="/articles" 
              element={
                <div className="w-full">
                  <ArticlesPage />
                </div>
              } 
            />
            <Route 
              path="/articles/:slug" 
              element={
                <div className="w-full">
                  <ArticlePage />
                </div>
              } 
            />
            {/* Hidden Jobs route - accessible via direct URL */}
            <Route 
              path="/jobs" 
              element={
                <div className="w-full">
                  <JobsPage />
                </div>
              } 
            />
            {/* Hidden Network routes - accessible via direct URL */}
            <Route 
              path="/directory" 
              element={
                <div className="w-full">
                  <NetworkDirectoryPage />
                </div>
              } 
            />
            <Route 
              path="/directory/create" 
              element={
                <div className="w-full">
                  <NetworkCreateProfilePage />
                </div>
              } 
            />
            <Route 
              path="/directory/profile/:slug" 
              element={
                <div className="w-full">
                  <NetworkProfilePage />
                </div>
              } 
            />
            <Route 
              path="/directory/auth" 
              element={
                <div className="w-full">
                  <NetworkAuthPage />
                </div>
              } 
            />
            <Route 
              path="/directory/dashboard" 
              element={
                <div className="w-full">
                  <NetworkDashboardPage />
                </div>
              } 
            />
            <Route
              path="/directory/edit"
              element={
                <div className="w-full">
                  <NetworkEditProfilePage />
                </div>
              }
            />
            {/* Auth callback route for OAuth (Google) and magic links */}
            <Route
              path="/directory/auth/callback"
              element={
                <div className="w-full">
                  <AuthCallbackPage />
                </div>
              }
            />
            <Route
              path="/auth/callback"
              element={
                <div className="w-full">
                  <AuthCallbackPage />
                </div>
              }
            />
            {/* Discover Talent / Job Matching route */}
            <Route
              path="/discover-talent"
              element={
                <div className="w-full">
                  <HirePage />
                </div>
              }
            />
            {/* Admin Portal route */}
            <Route
              path="/admin"
              element={
                <div className="w-full">
                  <AdminDashboardPage />
                </div>
              }
            />
            {/* Company Purchase Credits route */}
            <Route
              path="/company/purchase-credits"
              element={
                <div className="w-full">
                  <PurchaseCreditsPage />
                </div>
              }
            />
            {/* Company Auth route */}
            <Route
              path="/company/auth"
              element={
                <div className="w-full">
                  <CompanyAuthPage />
                </div>
              }
            />
            {/* Company Request Access route */}
            <Route
              path="/company/request-access"
              element={
                <div className="w-full">
                  <CompanyRequestAccessPage />
                </div>
              }
            />
            {/* Company Register route (legacy - kept for existing users) */}
            <Route
              path="/company/register"
              element={
                <div className="w-full">
                  <CompanyRegisterPage />
                </div>
              }
            />
            {/* Company Dashboard route */}
            <Route
              path="/company/dashboard"
              element={
                <div className="w-full">
                  <CompanyDashboardPage />
                </div>
              }
            />
            {/* Company CT Finder route */}
            <Route
              path="/company/ct-finder"
              element={
                <div className="w-full">
                  <CompanyCTFinderPage />
                </div>
              }
            />
            {/* Messages / Chat route */}
            <Route
              path="/messages"
              element={
                <div className="w-full">
                  <ChatPage />
                </div>
              }
            />
            {/* Hidden Beta signup route - accessible via direct URL only */}
            <Route
              path="/beta"
              element={
                <div className="w-full">
                  <BetaPage />
                </div>
              }
            />
            {/* Beta Hub - protected area for approved beta members */}
            <Route
              path="/beta/hub"
              element={
                <div className="w-full">
                  <BetaHubPage />
                </div>
              }
            />
            {/* Beta Auth - login page for beta members */}
            <Route
              path="/beta/auth"
              element={
                <div className="w-full">
                  <BetaAuthPage />
                </div>
              }
            />
            {/* Beta Account Setup - create account after approval */}
            <Route
              path="/beta/create-account"
              element={
                <div className="w-full">
                  <BetaAccountSetupPage />
                </div>
              }
            />
            {/* Password Reset - set new password after reset link */}
            <Route
              path="/reset-password"
              element={
                <div className="w-full">
                  <ResetPasswordPage />
                </div>
              }
            />
          </Routes>
        </div>
        
        {/* Global Footer - only show on contact, terms, and privacy pages */}
        {(location.pathname === '/contact' || location.pathname === '/terms' || location.pathname === '/privacy' || location.pathname === '/terms-and-conditions' || location.pathname === '/privacy-policy' || location.pathname === '/faq' || location.pathname === '/cases' || location.pathname === '/collaborations' || location.pathname === '/membership-form' || location.pathname === '/team' || location.pathname === '/partners') && (
          <div className="w-full">
            <Footer />
          </div>
        )}
      </main>
      
      {/* Global Cookie Notice */}
      <CookieNotice 
        onAccept={() => console.log('Cookies accepted')}
        onDecline={() => console.log('Cookies declined')}
      />
    </div>
  );
}

export default App;
