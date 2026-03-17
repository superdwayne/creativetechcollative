import React, { useState } from 'react';
import {
  Loader2,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Link,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SendResult {
  success: boolean;
  message: string;
  sent?: number;
  failed?: number;
  total?: number;
  testMode?: boolean;
  recipient?: string;
  failedEmails?: string[];
}

interface Props {
  accessToken: string;
  betaUserCount: number;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const BetaQuickMessageSection: React.FC<Props> = ({
  accessToken,
  betaUserCount,
  onToast,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [showCta, setShowCta] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid = subject.trim().length > 0 && message.trim().length > 0;

  const payload = () => ({
    subject: subject.trim(),
    message: message.trim(),
    ...(showCta && ctaText.trim() && ctaUrl.trim()
      ? { ctaText: ctaText.trim(), ctaUrl: ctaUrl.trim() }
      : {}),
  });

  const sendTest = async () => {
    if (!isValid) return;
    setSendingTest(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/quick-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...payload(), testMode: true, testEmail: testEmail.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test');
      setResult(data);
      onToast(data.message, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send test';
      setResult({ success: false, message: msg });
      onToast(msg, 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const sendLive = async () => {
    if (!isValid) return;
    setSending(true);
    setResult(null);
    setShowConfirm(false);
    try {
      const res = await fetch('/api/admin/quick-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setResult(data);
      onToast(data.message, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      setResult({ success: false, message: msg });
      onToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSubject('');
    setMessage('');
    setCtaText('');
    setCtaUrl('');
    setShowCta(false);
    setResult(null);
  };

  return (
    <div className="border border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-5 w-5 text-amber-400" />
        <h3 className="font-primary text-lg text-white">Quick Message</h3>
        <span className="text-xs font-secondary text-zinc-600 ml-auto">
          {betaUserCount} recipient{betaUserCount !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-zinc-500 font-secondary mb-6">
        Send a simple message to all approved beta users.
      </p>

      {/* Subject */}
      <div className="mb-4">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Subject *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Quick update from CTC"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Message */}
      <div className="mb-4">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Message *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here. Line breaks are preserved."
          rows={5}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-y min-h-[100px]"
        />
        <p className="text-xs text-zinc-600 font-secondary mt-1">
          Separate paragraphs with blank lines.
        </p>
      </div>

      {/* Optional CTA toggle */}
      <button
        onClick={() => setShowCta(!showCta)}
        className="flex items-center gap-1.5 text-xs font-secondary text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
      >
        <Link className="h-3.5 w-3.5" />
        Add a button link
        <ChevronDown className={cn('h-3 w-3 transition-transform', showCta && 'rotate-180')} />
      </button>

      {showCta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-zinc-800/30 border border-zinc-700/50">
          <div>
            <label className="block text-xs font-secondary text-zinc-600 mb-1">Button Text</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. Check It Out"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs font-secondary text-zinc-600 mb-1">Button URL</label>
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-5 mt-2" />

      {/* Test send */}
      <div className="mb-5 p-4 bg-zinc-800/30 border border-zinc-700/50">
        <h4 className="font-primary text-sm text-zinc-300 mb-2">Preview First</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Your email (blank = admin email)"
            className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={sendTest}
            disabled={sendingTest || !isValid}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {sendingTest ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <><Eye className="h-4 w-4" /> Send Test</>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={sending || !isValid}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-secondary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <><Send className="h-4 w-4" /> Send to All ({betaUserCount})</>
          )}
        </button>
        <button
          onClick={reset}
          className="text-sm font-secondary text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          'mt-4 p-4 border font-secondary text-sm',
          result.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        )}>
          <div className="flex items-start gap-2">
            {result.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.sent !== undefined && (
                <p className="mt-1 text-xs opacity-80">{result.sent} sent, {result.failed} failed out of {result.total}</p>
              )}
              {result.testMode && result.recipient && (
                <p className="mt-1 text-xs opacity-80">Test sent to: {result.recipient}</p>
              )}
              {result.failedEmails && result.failedEmails.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs opacity-80 hover:opacity-100">Show failed</summary>
                  <ul className="mt-1 text-xs opacity-70 list-disc list-inside">
                    {result.failedEmails.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-zinc-900 border border-amber-900/50 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-amber-500/10">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Send className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-primary text-lg text-white">Confirm Send</h3>
                <p className="text-sm text-zinc-400 font-secondary">This will email all beta users</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-zinc-300 font-secondary mb-4">
                Sending to <strong className="text-white">{betaUserCount} approved beta user{betaUserCount !== 1 ? 's' : ''}</strong>.
              </p>
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 mb-4">
                <p className="text-sm font-secondary text-zinc-400">
                  <span className="text-zinc-500">Subject:</span>{' '}
                  <span className="text-white">{subject}</span>
                </p>
                <p className="text-sm font-secondary text-zinc-400 mt-1 line-clamp-2">
                  <span className="text-zinc-500">Message:</span>{' '}
                  <span className="text-white">{message.slice(0, 120)}{message.length > 120 ? '...' : ''}</span>
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-sm font-secondary text-amber-300">
                Send a test email first to verify the content looks correct.
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendLive}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-secondary text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send to {betaUserCount}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaQuickMessageSection;
