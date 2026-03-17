import { useWebHaptics } from 'web-haptics/react';

/**
 * Wrapper around web-haptics for consistent haptic feedback across the site.
 * Falls back gracefully on devices that don't support the Vibration API.
 */
export function useHaptics() {
  const { trigger, cancel } = useWebHaptics();

  return {
    /** Light tap for navigation and button presses */
    tap: () => trigger('nudge'),
    /** Success feedback (e.g. form submission, sign-in) */
    success: () => trigger('success'),
    /** Error feedback (e.g. validation failure) */
    error: () => trigger('error'),
    /** Custom trigger - pass any preset name or pattern */
    trigger,
    /** Cancel ongoing haptic feedback */
    cancel,
  };
}
