import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import RotatingCube from './components/RotatingCube';
import Navigation from './components/Navigation';
import ResourcesSidebar from './components/ResourcesSidebar';
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
import TermsConditions from './components/TermsConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQPage from './components/FAQPage';
import WhitepaperPage from './pages/WhitepaperPage';
import MembershipFormPage from './pages/MembershipFormPage';
import Footer from './components/ui/footer';
import { CookieNotice } from './components/ui/cookie-notice';
import N8nOnboardingPage from './pages/N8nOnboardingPage';
import MissionPage from './pages/MissionPage';
import TeamPage from './pages/TeamPage';

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
  const [showResourcesNav, setShowResourcesNav] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const location = useLocation();

  // Generate categories dynamically from existing tags and categories
  const [categories, setCategories] = useState(() => {
    const categoryMap = new Map<string, { icon: string; count: number }>();
    
    // First, add existing categories from the links
    sampleLinks.forEach(link => {
      if (link.category) {
        const existing = categoryMap.get(link.category);
        categoryMap.set(link.category, {
          icon: existing?.icon || getCategoryIcon(link.category),
          count: (existing?.count || 0) + 1
        });
      }
    });
    
    // Then, add categories from tags that aren't already categories
    sampleLinks.forEach(link => {
      link.tags.forEach(tag => {
        if (!categoryMap.has(tag)) {
          // Check if any links have this tag
          const tagCount = sampleLinks.filter(l => 
            l.tags.includes(tag) || l.category === tag
          ).length;
          
          if (tagCount > 0) {
            categoryMap.set(tag, {
              icon: getCategoryIcon(tag),
              count: tagCount
            });
          }
        }
      });
    });
    
    // Convert to array and sort by count (most used first)
    return Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        name: id,
        icon: data.icon
      }))
      .sort((a, b) => {
        const aCount = categoryMap.get(a.id)?.count || 0;
        const bCount = categoryMap.get(b.id)?.count || 0;
        return bCount - aCount;
      });
  });

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
      
      if (location.pathname === '/resources') {
        if (totalScrollY > 10) {
          setShowResourcesNav(false);
        } else if (totalScrollY <= 5) {
          setShowResourcesNav(true);
        }
      } else {
        if (totalScrollY > 10) {
          setShowCubeIcon(false);
        } else if (totalScrollY <= 5) {
          setShowCubeIcon(true);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Only apply on mobile
      if (window.innerWidth >= 768) return;
      
      if (Math.abs(e.deltaY) > 0) {
        if (e.deltaY > 0) {
          if (location.pathname === '/resources') {
            setShowResourcesNav(false);
          } else {
            setShowCubeIcon(false);
          }
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
        if (location.pathname === '/resources') {
          setShowResourcesNav(false);
        } else {
          setShowCubeIcon(false);
        }
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
      setShowResourcesNav(true);
    }
  }, [location.pathname]);

  const isResourcesPage = location.pathname === '/resources';

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Navigation for non-resources pages */}
      {!isResourcesPage && location.pathname !== '/members' && (
        <Navigation 
          showCubeIcon={showCubeIcon}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}

      {/* Navigation for Members page */}
      {(location.pathname === '/members' || location.pathname === '/members-daybreak' || location.pathname === '/members-demo' || location.pathname === '/members-simple' || location.pathname === '/members-whisper') && (
        <div className="fixed top-0 left-0 right-0 z-[200]">
          <Navigation 
            showCubeIcon={showCubeIcon}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>
      )}

      {/* Sidebar for Resources page */}
      {isResourcesPage && (
        <>
          {/* Mobile Navigation for Resources - use the same navigation component */}
          <div className="md:hidden">
            <Navigation 
              showCubeIcon={showResourcesNav}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </div>

          {/* Desktop Sidebar */}
          <ResourcesSidebar 
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            setCategories={setCategories}
          />
        </>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${!isResourcesPage && location.pathname !== '/members' && location.pathname !== '/cases' ? 'p-4 md:p-8 pt-24' : isResourcesPage ? 'p-4 md:p-8 pt-20 md:pt-8' : location.pathname === '/cases' ? 'pt-24' : ''}`}>
        <div className={location.pathname === '/cases' ? 'w-full' : 'max-w-7xl mx-auto'}>
          <Routes>
            <Route 
              path="/" 
              element={<HomePage />} 
            />
            <Route 
              path="/mission" 
              element={
                <MissionPage />
              } 
            />
            <Route 
              path="/resources" 
              element={
                <ResourcesPage 
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  setCategories={setCategories} 
                />
              } 
            />
            <Route 
              path="/members" 
              element={
                <div className="fixed inset-0">
                  <MembersPage />
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
                <div className="w-full min-h-screen flex flex-col">
                  <Contact2 
                    title="Get In Touch"
                    description="Ready to collaborate, share resources, or join our creative technology community? We'd love to connect with you."
                    email="hello@creativetechcollective.com"
                    web={{ label: "creativetechcollective.com", url: "https://creativetechcollective.com" }}
                  />
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
              path="/n8n-onboarding" 
              element={
                <div className="w-full">
                  <N8nOnboardingPage />
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
          </Routes>
        </div>
        
        {/* Global Footer - only show on contact, terms, and privacy pages */}
        {(location.pathname === '/contact' || location.pathname === '/terms' || location.pathname === '/privacy' || location.pathname === '/terms-and-conditions' || location.pathname === '/privacy-policy' || location.pathname === '/faq' || location.pathname === '/cases' || location.pathname === '/collaborations' || location.pathname === '/n8n-onboarding' || location.pathname === '/membership-form' || location.pathname === '/team') && (
          <div className="w-full">
            <Footer />
          </div>
        )}
      </div>
      
      {/* Global Cookie Notice */}
      <CookieNotice 
        onAccept={() => console.log('Cookies accepted')}
        onDecline={() => console.log('Cookies declined')}
      />
    </div>
  );
}

export default App;