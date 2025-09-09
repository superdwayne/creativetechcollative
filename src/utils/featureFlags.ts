import React from 'react';

// Feature flags configuration
export interface FeatureFlags {
  highlightedResource?: {
    enabled: boolean;
    useFeaturedProperty?: boolean;
    resourceId?: string;
    title?: string;
    description?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  highlightedResource: {
    enabled: false,
    useFeaturedProperty: true,
    resourceId: undefined,
    title: undefined,
    description: undefined,
    backgroundColor: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
    borderColor: 'border-pink-500/50'
  }
};

// Load feature flags from environment variables or localStorage
export const getFeatureFlags = (): FeatureFlags => {
  // Check for environment variable first
  const envFeatureFlags = import.meta.env.VITE_FEATURE_FLAGS;
  
  if (envFeatureFlags) {
    try {
      const parsed = JSON.parse(envFeatureFlags);
      return { ...defaultFeatureFlags, ...parsed };
    } catch (error) {
      console.warn('Failed to parse VITE_FEATURE_FLAGS:', error);
    }
  }
  
  // Check localStorage for overrides
  const storedFlags = localStorage.getItem('feature-flags');
  if (storedFlags) {
    try {
      const parsed = JSON.parse(storedFlags);
      return { ...defaultFeatureFlags, ...parsed };
    } catch (error) {
      console.warn('Failed to parse stored feature flags:', error);
    }
  }
  
  return defaultFeatureFlags;
};

// Update feature flags
export const updateFeatureFlags = (flags: Partial<FeatureFlags>) => {
  const currentFlags = getFeatureFlags();
  const newFlags = { ...currentFlags, ...flags };
  localStorage.setItem('feature-flags', JSON.stringify(newFlags));
  
  // Trigger a custom event to notify components
  window.dispatchEvent(new CustomEvent('featureFlagsChanged', { detail: newFlags }));
};

// Hook to get feature flags with reactivity
export const useFeatureFlags = () => {
  const [flags, setFlags] = React.useState<FeatureFlags>(getFeatureFlags);
  
  React.useEffect(() => {
    const handleFlagsChange = (event: CustomEvent) => {
      setFlags(event.detail);
    };
    
    window.addEventListener('featureFlagsChanged', handleFlagsChange as EventListener);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChange as EventListener);
    };
  }, []);
  
  return flags;
}; 