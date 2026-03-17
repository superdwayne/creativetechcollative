import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { submitBetaFeedback } from '@/lib/supabase';
import { MessageSquarePlus, X, Send, CheckCircle2, ChevronDown } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ux', label: 'UX / Design' },
  { value: 'general', label: 'General Feedback' },
  { value: 'other', label: 'Other' },
];

const NUDGE_MESSAGES = [
  'How\'s the beta treating you?',
  'Got a sec? Drop us some feedback!',
  'Spot something? Let us know!',
  'Your feedback shapes the product.',
  'We\'d love to hear your thoughts.',
];

const STORAGE_KEY = 'ctc_feedback_state';
const NUDGE_INTERVAL_MIN = 3 * 60 * 1000; // 3 minutes minimum
const NUDGE_INTERVAL_MAX = 8 * 60 * 1000; // 8 minutes maximum
const NUDGE_COOLDOWN = 30 * 1000; // 30s after dismissing before next nudge

function getRandomInterval() {
  return Math.floor(Math.random() * (NUDGE_INTERVAL_MAX - NUDGE_INTERVAL_MIN)) + NUDGE_INTERVAL_MIN;
}

function getStoredState(): { lastDismissed: number; feedbackCount: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { lastDismissed: 0, feedbackCount: 0 };
}

function setStoredState(state: { lastDismissed?: number; feedbackCount?: number }) {
  try {
    const current = getStoredState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {}
}

const BetaFeedbackWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { tap, success: hapticSuccess, error: hapticError } = useHaptics();
  const [isOpen, setIsOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');

  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scheduleNudge = useCallback(() => {
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);

    const stored = getStoredState();
    const timeSinceDismiss = Date.now() - stored.lastDismissed;
    const delay = timeSinceDismiss < NUDGE_COOLDOWN
      ? NUDGE_COOLDOWN - timeSinceDismiss + getRandomInterval()
      : getRandomInterval();

    nudgeTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
        setNudgeMessage(msg);
        setShowNudge(true);

        // Auto-hide nudge after 8 seconds
        setTimeout(() => {
          setShowNudge(false);
          scheduleNudge();
        }, 8000);
      }
    }, delay);
  }, [isOpen]);

  useEffect(() => {
    scheduleNudge();
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [scheduleNudge]);

  // Close nudge when form opens
  useEffect(() => {
    if (isOpen) setShowNudge(false);
  }, [isOpen]);

  const dismissNudge = () => {
    setShowNudge(false);
    setStoredState({ lastDismissed: Date.now() });
    scheduleNudge();
  };

  const openForm = () => {
    tap();
    setShowNudge(false);
    setIsOpen(true);
    setSubmitted(false);
    setError('');
  };

  const closeForm = () => {
    tap();
    setIsOpen(false);
    setCategory('general');
    setRating(0);
    setMessage('');
    setError('');
    scheduleNudge();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write some feedback before submitting.');
      hapticError();
      return;
    }
    if (!user) {
      setError('You need to be logged in to submit feedback.');
      hapticError();
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await submitBetaFeedback({
      userId: user.id,
      userEmail: user.email,
      pageUrl: location.pathname,
      category,
      rating: rating > 0 ? rating : undefined,
      message: message.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      hapticSuccess();
      setSubmitted(true);
      setStoredState({ feedbackCount: getStoredState().feedbackCount + 1 });
      setTimeout(() => {
        closeForm();
        setSubmitted(false);
      }, 2500);
    } else {
      hapticError();
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-2">
      {/* Feedback form panel */}
      {isOpen && (
        <div
          ref={formRef}
          className="animate-in slide-in-from-bottom-4 fade-in duration-300 w-[320px] max-h-[440px] rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-3.5 w-3.5 text-zinc-400" />
              <h3 className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Feedback</h3>
            </div>
            <button
              onClick={closeForm}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5 text-white/40" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-white text-sm font-medium">Thanks!</p>
              <p className="text-white/40 text-xs mt-1">Your feedback has been recorded.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Category */}
              <div>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 pr-8"
                  >
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-zinc-900">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Star rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { tap(); setRating(star === rating ? 0 : star); }}
                    className={`h-7 w-7 rounded flex items-center justify-center transition-all text-sm ${
                      star <= rating
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/5 text-white/15 hover:text-white/30'
                    }`}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bugs, ideas, anything..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none"
              />

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-white/20 text-white text-sm rounded-lg px-3 py-2 transition-colors"
              >
                {submitting ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Send
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Subtle icon button */}
      {!isOpen && (
        <button
          onClick={openForm}
          className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 text-white/25 hover:text-white/50 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default BetaFeedbackWidget;
