import React from 'react';

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
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };
  return (
    <div className="hidden md:block w-64 bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-800/50 animate-in slide-in-from-left duration-300 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white font-primary mb-2">Resources</h2>
          <p className="text-sm text-zinc-400 font-secondary">Curated tools and resources from the collective</p>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <h3 className="text-sm font-medium text-white font-primary mb-2">About This Collection</h3>
            <p className="text-xs text-zinc-400 font-secondary leading-relaxed">
              Discover tools, resources, and inspiration shared by members of the Creative Technology Collective.
            </p>
          </div>

          {activeCategory && (
            <div className="p-4 bg-pink-500/10 rounded-xl border border-pink-500/30">
              <h3 className="text-sm font-medium text-pink-400 font-primary mb-1">Current Filter</h3>
              <p className="text-xs text-zinc-400 font-secondary">
                Showing <span className="text-pink-400 font-medium capitalize">{activeCategory}</span> resources
              </p>
            </div>
          )}

          <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
            <h3 className="text-sm font-medium text-white font-primary mb-2">Browse Categories</h3>
            <p className="text-xs text-zinc-400 font-secondary">
              Use the filter bar above to explore different categories and find exactly what you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesSidebar;