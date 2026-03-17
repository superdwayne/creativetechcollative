import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that tracks user presence by periodically updating last_seen_at.
 * This prevents email notifications from being sent when the user is actively using the app.
 * 
 * Should be used on pages where users are likely to be active and should not receive email
 * notifications (e.g., dashboard, messages, profile pages).
 */
export function usePresence() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;

    const updatePresence = async () => {
      try {
        await fetch('/api/messages/presence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ status: 'online' }),
        });
      } catch (error) {
        // Silently fail - presence is not critical
      }
    };

    // Update presence immediately when component mounts
    updatePresence();

    // Update presence every 2 minutes while on the page
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    // Also update on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.access_token]);
}
