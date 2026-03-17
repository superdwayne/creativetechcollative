import React, { useState, useEffect } from 'react';
import { Alert, AlertContent, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { X, Cookie } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface CookieNoticeProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieNotice({ onAccept, onDecline }: CookieNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { tap } = useHaptics();

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent');
    if (!cookieChoice) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    tap();
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    tap();
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onDecline?.();
  };

  const handleClose = () => {
    tap();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-200">
      <Alert
        className="min-w-[350px] max-w-[400px] border-zinc-700"
        layout="complex"
        isNotification
        size="lg"
        action={
          <button
            variant="ghost"
            className="group -my-1.5 -me-2 size-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer"
            aria-label="Close notification"
            onClick={handleClose}
          >
            <X
              size={16}
              strokeWidth={2}
              className="opacity-60 transition-opacity group-hover:opacity-100"
            />
          </button>
        }
        icon={<Cookie className="w-5 h-5 text-purple-400" />}
      >
        <AlertContent>
          <AlertTitle className="text-white font-primary">We Value Your Privacy 🍪</AlertTitle>
          <AlertDescription className="text-zinc-300 font-secondary">
            We use cookies to improve your experience and show personalized content. 
            Your privacy matters to us.
          </AlertDescription>
          <div className="flex gap-2 pt-3">
            <ButtonColorful
              size="sm" 
              onClick={handleAccept}
              label="Accept"
              className="text-sm px-4 py-2 h-8"
            />
            <button
              size="sm" 
              onClick={handleDecline}
              className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-primary text-sm px-4 py-2 h-8 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </AlertContent>
      </Alert>
    </div>
  );
}