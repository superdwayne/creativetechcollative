import React from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import RotatingCube from './RotatingCube';

interface NavigationProps {
  showCubeIcon: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  showCubeIcon,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', mobileLabel: 'Home', path: '/' },
    { id: 'resources', label: 'Resources', path: '/resources' },
    { id: 'mission', label: 'About the Collective', path: '/mission' },
    { id: 'members', label: 'Members', path: '/members' },
    { id: 'cases', label: 'Collaborations', mobileLabel: 'Collabs', path: '/collaborations' },
    { id: 'contact', label: 'Contact', path: '/contact' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent animate-in slide-in-from-top duration-300">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className={`text-xl font-black text-left flex items-center transition-all duration-1000 ease-out ${
              showCubeIcon ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2 pointer-events-none'
            }`}>
              <button onClick={() => handleNavigation('/')}>
                <RotatingCube>
                  <span className="text-white font-secondary">CTC</span>
                </RotatingCube>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 ml-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`px-2 py-1 rounded-lg transition-colors font-secondary font-medium text-sm ${
                    isActive(item.path)
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white bg-black/80 backdrop-blur-sm rounded-lg border border-zinc-800/50 transition-all duration-300 hover:bg-black/90 hover:border-zinc-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black md:hidden">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-6">
              <div className="text-xl font-black text-left flex items-center">
                <button onClick={() => handleNavigation('/')}>
                  <RotatingCube>
                    <span className="text-white font-secondary">CTC</span>
                  </RotatingCube>
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white hover:text-zinc-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col justify-center px-8">
              <nav className="space-y-8">
                {navItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`block w-full text-left transition-all duration-300 transform hover:translate-x-4 ${
                      isActive(item.path)
                        ? 'text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <span className="text-6xl md:text-7xl font-black font-secondary font-medium uppercase tracking-tight leading-none block">
                    </span>
                    <span className="text-5xl md:text-7xl font-black font-secondary font-medium uppercase tracking-tight leading-none block">
                      {item.mobileLabel || item.label}
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