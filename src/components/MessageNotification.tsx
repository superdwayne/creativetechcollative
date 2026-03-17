import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X, Volume2, VolumeX, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface NotificationData {
  id: string;
  senderName: string;
  content: string;
  conversationId: string;
  conversationType: 'job_match' | 'direct';
  timestamp: number;
}

const NOTIFICATION_DURATION = 6000; // 6 seconds

// Simple notification sound using Web Audio API (no external files needed)
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);

    // Second tone (slightly delayed)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.setValueAtTime(0.12, audioContext.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.5);

    // Clean up audio context after sounds finish
    setTimeout(() => audioContext.close(), 1000);
  } catch {
    // Audio not available, silently ignore
  }
}

// Request browser notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show browser notification
function showBrowserNotification(senderName: string, content: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(`New message from ${senderName}`, {
        body: content.substring(0, 100),
        icon: '/favicon.ico',
        tag: 'ctc-message', // Prevents duplicate notifications
        silent: true, // We play our own sound
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Focus window on click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Notification API not available
    }
  }
}

const MessageNotification: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const profileIdRef = useRef<string | null>(null);
  const userTypeRef = useRef<'company' | 'member' | null>(null);
  const locationRef = useRef(location.pathname);

  // Keep location ref in sync
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  // Handle user opting in to notifications
  const enableNotifications = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  }, []);

  // Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem('ctc-notification-sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  // Fetch user profile info for matching sender
  useEffect(() => {
    if (!session?.access_token) return;

    // Get profile ID for direct message matching
    fetch('/api/messages/direct/conversations', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profileId) {
          profileIdRef.current = data.profileId;
        }
      })
      .catch(() => {});

    // Get user type for job match message matching
    fetch('/api/messages/conversations', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.userType) {
          userTypeRef.current = data.userType;
        }
      })
      .catch(() => {});
  }, [session?.access_token]);

  // Remove a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Handle clicking a notification
  const handleNotificationClick = useCallback((notification: NotificationData) => {
    dismissNotification(notification.id);
    
    if (notification.conversationType === 'direct') {
      navigate(`/messages?type=direct&id=${notification.conversationId}`);
    } else {
      navigate(`/messages?matchId=${notification.conversationId}`);
    }
  }, [dismissNotification, navigate]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ctc-notification-sound', String(next));
      return next;
    });
  }, []);

  // Auto-dismiss notifications after duration
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map(n => {
      const elapsed = Date.now() - n.timestamp;
      const remaining = Math.max(NOTIFICATION_DURATION - elapsed, 0);
      return setTimeout(() => dismissNotification(n.id), remaining);
    });

    return () => timers.forEach(clearTimeout);
  }, [notifications, dismissNotification]);

  // Helper to add notification with sound + browser notification
  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      // Prevent duplicate notifications
      if (prev.some(n => n.id === notification.id)) return prev;
      // Keep max 3 notifications
      const updated = [...prev, notification];
      return updated.slice(-3);
    });

    // Play sound
    if (soundEnabled) {
      playNotificationSound();
    }

    // Show browser notification (for when tab is not focused)
    if (document.hidden) {
      showBrowserNotification(notification.senderName, notification.content);
    }
  }, [soundEnabled]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!supabase || !user) return;

    const channels: any[] = [];

    // Listen for direct messages
    const directChannel = supabase
      .channel('notif-direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const msg = payload.new as any;

          // Don't notify for own messages
          if (msg.sender_id === profileIdRef.current) return;

          // Don't notify if already on the messages page
          // (Use ref to always get the latest pathname, avoiding stale closures)
          if (locationRef.current === '/messages') return;

          // Try to get sender name from the conversation
          let senderName = 'Someone';
          try {
            if (session?.access_token) {
              const res = await fetch(`/api/messages/direct/conversations`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              const data = await res.json();
              if (data.success) {
                const conv = data.conversations?.find(
                  (c: any) => (c.id || c.conversationId) === msg.conversation_id
                );
                if (conv) {
                  senderName = conv.participant?.name || conv.participantName || 'Someone';
                }
              }
            }
          } catch {
            // fallback to generic name
          }

          addNotification({
            id: msg.id,
            senderName,
            content: msg.content?.substring(0, 100) || 'New message',
            conversationId: msg.conversation_id,
            conversationType: 'direct',
            timestamp: Date.now(),
          });
        }
      )
      .subscribe();
    channels.push(directChannel);

    // Listen for job match messages
    const jobMatchChannel = supabase
      .channel('notif-job-match-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as any;

          // Don't notify for own messages
          if (msg.sender_type === userTypeRef.current) return;

          // Don't notify if already on the messages page
          if (locationRef.current === '/messages') return;

          // Try to get sender name
          let senderName = 'Someone';
          try {
            if (session?.access_token) {
              const res = await fetch(`/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              const data = await res.json();
              if (data.success) {
                const conv = data.conversations?.find(
                  (c: any) => c.matchId === msg.match_id
                );
                if (conv) {
                  senderName = conv.participantName || 'Someone';
                }
              }
            }
          } catch {
            // fallback
          }

          addNotification({
            id: msg.id,
            senderName,
            content: msg.content?.substring(0, 100) || 'New message',
            conversationId: msg.match_id,
            conversationType: 'job_match',
            timestamp: Date.now(),
          });
        }
      )
      .subscribe();
    channels.push(jobMatchChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
    // Only re-subscribe when user/session changes, NOT on location or addNotification changes.
    // Callbacks read refs for fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token]);

  if (notifications.length === 0) {
    // Show opt-in button when user is logged in but hasn't granted permission
    if (user && 'Notification' in window && Notification.permission === 'default') {
      return (
        <button
          onClick={enableNotifications}
          className="fixed top-20 right-4 z-[70] flex items-center gap-2 px-3 py-2 bg-zinc-900/95 border border-zinc-700/50 rounded-xl text-xs text-zinc-300 hover:text-white hover:border-zinc-600 transition-all backdrop-blur-md shadow-lg"
          title="Enable desktop notifications for new messages"
        >
          <Bell className="h-3.5 w-3.5" />
          Enable notifications
        </button>
      );
    }
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[70] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            "pointer-events-auto bg-zinc-900/95 border border-zinc-700/50 rounded-xl p-4 shadow-2xl shadow-black/50 backdrop-blur-md",
            "cursor-pointer",
            "hover:border-zinc-600 transition-all duration-300",
            "animate-slide-in-notification"
          )}
          style={{ 
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'both',
          }}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            {/* Icon with pulse animation */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-pink-400" />
              </div>
              {/* Pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {notification.senderName}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {notification.content}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Tap to reply
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              {/* Dismiss */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="p-1 text-zinc-500 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {/* Sound toggle (only on first notification) */}
              {index === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSound();
                  }}
                  className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors rounded-md hover:bg-zinc-800"
                  title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3 w-3" />
                  ) : (
                    <VolumeX className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar that shows time remaining */}
          <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full animate-notification-progress"
              style={{ animationDuration: `${NOTIFICATION_DURATION}ms` }}
            />
          </div>
        </div>
      ))}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes slide-in-notification {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-in-notification {
          animation: slide-in-notification 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes notification-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-notification-progress {
          animation: notification-progress linear forwards;
        }
      `}</style>
    </div>
  );
};

export default MessageNotification;
