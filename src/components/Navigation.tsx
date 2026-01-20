import React, { useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  showCubeIcon: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Always scroll to top when the route changes (desktop and mobile)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Left nav items
  const leftNavItems = [
    { id: 'mission', label: 'About', path: '/mission' },
    { id: 'members', label: 'Members', path: '/members' },
    { id: 'newsletter', label: 'Newsletter', path: '/newsletter' },
  ];

  // Right nav items
  const rightNavItems = [
    { id: 'playground', label: 'Playground', path: '/playground' },
    { id: 'partners', label: 'Partners', path: '/partners' },
    { id: 'contact', label: 'Contact', path: '/contact' },
  ];

  // All nav items for mobile
  const allNavItems = [
    { id: 'home', label: 'Home', path: '/' },
    ...leftNavItems,
    ...rightNavItems,
    { id: 'collaborations', label: 'Collaborations', path: '/collaborations' },
  ];

  const handleNavigation = (path: string) => {
    // Check if the path corresponds to a section on the home page
    const sectionMap: { [key: string]: string } = {
      '/mission': 'mission',
      '/members': 'members',
      '/partners': 'partners',
      '/collaborations': 'collaborations',
      '/newsletter': 'newsletter'
    };

    const isHomePage = location.pathname === '/' || location.pathname === '/home';
    const sectionId = sectionMap[path];

    if (isHomePage && sectionId) {
      // Already on home page - smooth scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        // For newsletter, scroll to center for better visibility
        const scrollOptions: ScrollIntoViewOptions = {
          behavior: 'smooth',
          block: sectionId === 'newsletter' ? 'center' : 'start'
        };
        element.scrollIntoView(scrollOptions);
        setMobileMenuOpen(false);
        return;
      }
    } else if (sectionId) {
      // Not on home page but path is a section - navigate to home then scroll
      navigate('/');
      setMobileMenuOpen(false);
      // Wait for navigation to complete, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          // For newsletter, scroll to center for better visibility
          const scrollOptions: ScrollIntoViewOptions = {
            behavior: 'smooth',
            block: sectionId === 'newsletter' ? 'center' : 'start'
          };
          element.scrollIntoView(scrollOptions);
        }
      }, 500);
      return;
    }

    // Only navigate to actual pages (not sections)
    // Don't navigate if it's a section path
    if (!sectionMap[path]) {
      navigate(path);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Navigation - Centered Logo Layout */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-6 py-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between">
            
            {/* Left: Nav Links */}
            <nav className="hidden md:flex items-center space-x-6 flex-1">
              {leftNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-sm font-secondary tracking-wide transition-colors ${
                    isActive(item.path)
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Center: Logo */}
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center justify-center"
            >
              <img 
                src="/ctc-logo-white.svg" 
                alt="CTC Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (sibling) sibling.style.display = 'block';
                }}
              />
              <span className="hidden text-xl font-semibold text-white tracking-tight font-secondary">
                CTC
              </span>
            </button>

            {/* Right: Nav Links */}
            <nav className="hidden md:flex items-center space-x-6 flex-1 justify-end">
              {rightNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-sm font-secondary tracking-wide transition-colors ${
                    isActive(item.path)
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black md:hidden">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-6">
              <button onClick={() => handleNavigation('/')} className="text-xl font-semibold text-white font-secondary">
                CTC
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white hover:text-zinc-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col justify-center px-8">
              <nav className="space-y-6">
                {allNavItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`block w-full text-left transition-all duration-300 transform hover:translate-x-4 ${
                      isActive(item.path)
                        ? 'text-white' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <span className="text-4xl font-medium font-secondary uppercase tracking-tight leading-none block">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-zinc-800">
              <p className="text-zinc-500 text-sm font-secondary uppercase tracking-wider">
                Creative Technology Collective
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
