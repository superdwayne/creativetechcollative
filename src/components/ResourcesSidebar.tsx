import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RotatingCube from './RotatingCube';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ResourcesSidebarProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  setCategories: (categories: Category[]) => void;
}

const ResourcesSidebar: React.FC<ResourcesSidebarProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  setCategories
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'resources', label: 'Resources', path: '/resources' },
    { id: 'members', label: 'Members', path: '/members' },
    { id: 'cases', label: 'Collaborations', path: '/cases' },
    { id: 'contact', label: 'Contact', path: '/contact' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };
  return (
    <div className="hidden md:block w-64 bg-zinc-900/50 border-r border-zinc-800 animate-in slide-in-from-left duration-300 sticky top-0 h-screen overflow-y-auto">
      <div className="p-6">
      <div className="mb-8 relative">
        {/* Background cube */}
        <button 
          onClick={() => handleNavigation('/')}
          className="w-full h-[100px] flex justify-start items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
        >
          <RotatingCube>
            <span className="text-white font-secondary text-lg font-bold">CTC</span>
          </RotatingCube>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="mb-8 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium font-primary ${
              isActive(item.path)
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-zinc-800 pt-6 mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider font-secondary">Tags</h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <button
          onClick={() => handleCategoryClick('')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium font-primary ${
            !activeCategory 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          all
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium font-primary ${
              activeCategory === category.id 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span className="text-sm">{category.icon}</span>
            <span className="truncate">{category.name}</span>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
};

export default ResourcesSidebar;