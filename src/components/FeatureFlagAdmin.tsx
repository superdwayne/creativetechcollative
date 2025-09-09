import React, { useState } from 'react';
import { Settings, Sparkles, X } from 'lucide-react';
import { useFeatureFlags, updateFeatureFlags } from '@/utils/featureFlags';

const FeatureFlagAdmin: React.FC = () => {
  const featureFlags = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightConfig, setHighlightConfig] = useState({
    enabled: featureFlags.highlightedResource?.enabled || false,
    useFeaturedProperty: featureFlags.highlightedResource?.useFeaturedProperty ?? true,
    resourceId: featureFlags.highlightedResource?.resourceId || '',
    title: featureFlags.highlightedResource?.title || '',
    description: featureFlags.highlightedResource?.description || '',
    backgroundColor: featureFlags.highlightedResource?.backgroundColor || 'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
    borderColor: featureFlags.highlightedResource?.borderColor || 'border-pink-500/50'
  });

  const handleSave = () => {
    updateFeatureFlags({
      highlightedResource: highlightConfig
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    updateFeatureFlags({
      highlightedResource: {
        enabled: false,
        useFeaturedProperty: true,
        resourceId: undefined,
        title: undefined,
        description: undefined,
        backgroundColor: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
        borderColor: 'border-pink-500/50'
      }
    });
    setHighlightConfig({
      enabled: false,
      useFeaturedProperty: true,
      resourceId: '',
      title: '',
      description: '',
      backgroundColor: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
      borderColor: 'border-pink-500/50'
    });
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Feature Flag Admin"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Feature Flag Admin
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Highlighted Resource Section */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Highlighted Resource</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={highlightConfig.enabled}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm text-zinc-300">Enable highlighted resource</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={highlightConfig.useFeaturedProperty}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, useFeaturedProperty: e.target.checked }))}
                      className="rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm text-zinc-300">Use property_featured field</span>
                  </label>

                  {!highlightConfig.useFeaturedProperty && (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Resource ID</label>
                      <input
                        type="text"
                        value={highlightConfig.resourceId}
                        onChange={(e) => setHighlightConfig(prev => ({ ...prev, resourceId: e.target.value }))}
                        placeholder="Enter resource ID to highlight"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Custom Title (optional)</label>
                    <input
                      type="text"
                      value={highlightConfig.title}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Custom title for highlighted resource"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Custom Description (optional)</label>
                    <textarea
                      value={highlightConfig.description}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Custom description for highlighted resource"
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Background Color Class</label>
                    <input
                      type="text"
                      value={highlightConfig.backgroundColor}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      placeholder="Tailwind CSS class for background"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Border Color Class</label>
                    <input
                      type="text"
                      value={highlightConfig.borderColor}
                      onChange={(e) => setHighlightConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                      placeholder="Tailwind CSS class for border"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureFlagAdmin; 