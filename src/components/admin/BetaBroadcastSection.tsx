import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Link,
  Users,
  UserCheck,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateSection {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface BroadcastResult {
  success: boolean;
  message: string;
  sent?: number;
  failed?: number;
  total?: number;
  testMode?: boolean;
  recipient?: string;
  failedEmails?: string[];
}

interface BetaRecipient {
  name: string;
  email: string;
}

interface Props {
  accessToken: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const BetaBroadcastSection: React.FC<Props> = ({ accessToken, onToast }) => {
  // Form state
  const [subject, setSubject] = useState('');
  const [headline, setHeadline] = useState('');
  const [introText, setIntroText] = useState('');
  const [closingText, setClosingText] = useState('');
  const [updates, setUpdates] = useState<UpdateSection[]>([
    { title: '', description: '', ctaText: '', ctaUrl: '' },
  ]);

  // Recipient state
  const [recipients, setRecipients] = useState<BetaRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');

  // UI state
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch approved beta recipients
  const fetchRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch('/api/admin/beta-broadcast', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error('Failed to fetch recipients');

      const data = await response.json();
      setRecipients(data.recipients || []);
    } catch (err) {
      console.error('Failed to fetch beta recipients:', err);
      onToast('Failed to load beta user list', 'error');
    } finally {
      setLoadingRecipients(false);
    }
  }, [accessToken, onToast]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Recipient selection helpers
  const toggleRecipient = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedEmails(new Set(filteredRecipients.map((r) => r.email)));
  };

  const deselectAll = () => {
    setSelectedEmails(new Set());
  };

  const filteredRecipients = recipients.filter((r) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const addUpdateSection = () => {
    setUpdates([...updates, { title: '', description: '', ctaText: '', ctaUrl: '' }]);
  };

  const removeUpdateSection = (index: number) => {
    if (updates.length <= 1) return;
    setUpdates(updates.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: keyof UpdateSection, value: string) => {
    const newUpdates = [...updates];
    newUpdates[index] = { ...newUpdates[index], [field]: value };
    setUpdates(newUpdates);
  };

  const isFormValid = () => {
    if (!subject.trim() || !headline.trim() || !introText.trim()) return false;
    if (!updates.every((u) => u.title.trim() && u.description.trim())) return false;
    // If sending to selected, must have at least one selected
    if (!sendToAll && selectedEmails.size === 0) return false;
    return true;
  };

  const getPayload = () => ({
    subject: subject.trim(),
    headline: headline.trim(),
    introText: introText.trim(),
    updates: updates.map((u) => ({
      title: u.title.trim(),
      description: u.description.trim(),
      ctaText: u.ctaText?.trim() || undefined,
      ctaUrl: u.ctaUrl?.trim() || undefined,
    })),
    closingText: closingText.trim() || undefined,
    ...(!sendToAll && selectedEmails.size > 0
      ? { selectedEmails: Array.from(selectedEmails) }
      : {}),
  });

  const sendTestBroadcast = async () => {
    if (!isFormValid()) return;

    setSendingTest(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/beta-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...getPayload(),
          testMode: true,
          testEmail: testEmail.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test');
      }

      setResult(data);
      onToast(data.message, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send test email';
      setResult({ success: false, message: msg });
      onToast(msg, 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const sendBroadcast = async () => {
    if (!isFormValid()) return;

    setSending(true);
    setResult(null);
    setShowConfirmModal(false);

    try {
      const response = await fetch('/api/admin/beta-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(getPayload()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send broadcast');
      }

      setResult(data);
      onToast(data.message, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send broadcast';
      setResult({ success: false, message: msg });
      onToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setHeadline('');
    setIntroText('');
    setClosingText('');
    setUpdates([{ title: '', description: '', ctaText: '', ctaUrl: '' }]);
    setResult(null);
    setSendToAll(true);
    setSelectedEmails(new Set());
    setRecipientSearch('');
  };

  const recipientCount = sendToAll ? recipients.length : selectedEmails.size;

  return (
    <div className="border border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="h-5 w-5 text-amber-400" />
        <h3 className="font-primary text-lg text-white">Compose Broadcast</h3>
      </div>
      <p className="text-sm text-zinc-500 font-secondary mb-6">
        Send an email update to approved beta users. The email will match the CTC branded template style.
      </p>

      {/* ================================================================ */}
      {/* RECIPIENTS SECTION */}
      {/* ================================================================ */}
      <div className="mb-6 p-4 bg-zinc-800/30 border border-zinc-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <h4 className="font-primary text-sm text-zinc-300">Recipients</h4>
            <span className="text-xs font-secondary text-zinc-600">
              ({recipients.length} approved beta user{recipients.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            onClick={fetchRecipients}
            disabled={loadingRecipients}
            className="text-xs font-secondary text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            title="Refresh recipient list"
          >
            <RefreshCw className={cn('h-3 w-3', loadingRecipients && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Toggle: All vs Selected */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSendToAll(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-secondary transition-colors border',
              sendToAll
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            All Beta Users
          </button>
          <button
            onClick={() => setSendToAll(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-secondary transition-colors border',
              !sendToAll
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Select Recipients
            {!sendToAll && selectedEmails.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-sm">
                {selectedEmails.size}
              </span>
            )}
          </button>
        </div>

        {/* Selection UI - only shown when "Select Recipients" is active */}
        {!sendToAll && (
          <div className="mt-3">
            {loadingRecipients ? (
              <div className="flex items-center justify-center py-6 text-zinc-500 text-sm font-secondary">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading beta users...
              </div>
            ) : recipients.length === 0 ? (
              <p className="text-sm text-zinc-500 font-secondary py-4 text-center">
                No approved beta users found.
              </p>
            ) : (
              <>
                {/* Search + select/deselect all */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-xs focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <button
                    onClick={selectAll}
                    className="text-xs font-secondary text-zinc-500 hover:text-amber-400 transition-colors whitespace-nowrap"
                  >
                    Select all
                  </button>
                  <span className="text-zinc-700">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs font-secondary text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>

                {/* Recipient list */}
                <div className="max-h-56 overflow-y-auto border border-zinc-700/50 bg-zinc-900/50">
                  {filteredRecipients.length === 0 ? (
                    <p className="text-xs text-zinc-600 font-secondary p-3 text-center">
                      No matches for &quot;{recipientSearch}&quot;
                    </p>
                  ) : (
                    filteredRecipients.map((r) => {
                      const isSelected = selectedEmails.has(r.email);
                      return (
                        <button
                          key={r.email}
                          onClick={() => toggleRecipient(r.email)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors border-b border-zinc-800/50 last:border-b-0',
                            isSelected
                              ? 'bg-amber-500/10 hover:bg-amber-500/15'
                              : 'hover:bg-zinc-800/50'
                          )}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-secondary text-white block truncate">
                              {r.name || 'Unnamed'}
                            </span>
                            <span className="text-xs font-secondary text-zinc-500 block truncate">
                              {r.email}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selection count */}
                <p className="text-xs font-secondary text-zinc-500 mt-2">
                  {selectedEmails.size} of {recipients.length} selected
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* EMAIL CONTENT */}
      {/* ================================================================ */}

      {/* Email Subject */}
      <div className="mb-5">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Email Subject Line *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. New Features Available in CTC Beta"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Headline */}
      <div className="mb-5">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Email Headline *
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. What's New in CTC"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
        />
        <p className="text-xs text-zinc-600 font-secondary mt-1">
          This appears as the main heading inside the email card.
        </p>
      </div>

      {/* Intro Text */}
      <div className="mb-5">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Introduction Text *
        </label>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          placeholder="e.g. Hi there! We've been busy building new features for you. Here's what's new..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
        />
      </div>

      {/* Update Sections */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-secondary text-zinc-500 uppercase tracking-wide">
            Updates / Features *
          </label>
          <button
            onClick={addUpdateSection}
            className="flex items-center gap-1 text-xs font-secondary text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
          </button>
        </div>

        <div className="space-y-4">
          {updates.map((update, index) => (
            <div
              key={index}
              className="relative p-4 bg-zinc-800/50 border border-zinc-700/50"
            >
              {/* Remove button */}
              {updates.length > 1 && (
                <button
                  onClick={() => removeUpdateSection(index)}
                  className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 transition-colors"
                  title="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="text-xs font-secondary text-zinc-600 mb-3">
                Update #{index + 1}
              </div>

              {/* Section Title */}
              <div className="mb-3">
                <input
                  type="text"
                  value={update.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="Feature title, e.g. Direct Messaging"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Section Description */}
              <div className="mb-3">
                <textarea
                  value={update.description}
                  onChange={(e) => updateSection(index, 'description', e.target.value)}
                  placeholder="Describe this update or feature..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Optional CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Link className="h-3 w-3 text-zinc-600" />
                    <span className="text-xs font-secondary text-zinc-600">Button Text (optional)</span>
                  </div>
                  <input
                    type="text"
                    value={update.ctaText || ''}
                    onChange={(e) => updateSection(index, 'ctaText', e.target.value)}
                    placeholder="e.g. Try It Now"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Link className="h-3 w-3 text-zinc-600" />
                    <span className="text-xs font-secondary text-zinc-600">Button URL (optional)</span>
                  </div>
                  <input
                    type="url"
                    value={update.ctaUrl || ''}
                    onChange={(e) => updateSection(index, 'ctaUrl', e.target.value)}
                    placeholder="https://creativetechnologists.nl/..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing Text */}
      <div className="mb-6">
        <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
          Closing Text (optional)
        </label>
        <textarea
          value={closingText}
          onChange={(e) => setClosingText(e.target.value)}
          placeholder="e.g. We'd love to hear your feedback! Reply to this email or reach out anytime."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800 pt-6 mb-6" />

      {/* Test Email Section */}
      <div className="mb-6 p-4 bg-zinc-800/30 border border-zinc-700/50">
        <h4 className="font-primary text-sm text-zinc-300 mb-3">Send Test First</h4>
        <p className="text-xs text-zinc-500 font-secondary mb-3">
          Preview the email by sending a test to yourself before broadcasting.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Your email (leave blank for admin email)"
            className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 font-secondary text-sm focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={sendTestBroadcast}
            disabled={sendingTest || !isFormValid()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {sendingTest ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Send Test Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={sending || !isFormValid()}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-secondary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {sendToAll
                ? `Broadcast to All Beta Users (${recipients.length})`
                : `Send to ${selectedEmails.size} Selected User${selectedEmails.size !== 1 ? 's' : ''}`}
            </>
          )}
        </button>

        <button
          onClick={resetForm}
          className="text-sm font-secondary text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Reset Form
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={cn(
            'mt-4 p-4 border font-secondary text-sm',
            result.success
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.sent !== undefined && (
                <p className="mt-1 text-xs opacity-80">
                  {result.sent} sent, {result.failed} failed out of {result.total} recipients
                </p>
              )}
              {result.testMode && result.recipient && (
                <p className="mt-1 text-xs opacity-80">
                  Test sent to: {result.recipient}
                </p>
              )}
              {result.failedEmails && result.failedEmails.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs opacity-80 hover:opacity-100">
                    Show failed emails
                  </summary>
                  <ul className="mt-1 text-xs opacity-70 list-disc list-inside">
                    {result.failedEmails.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-zinc-900 border border-amber-900/50 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-amber-500/10">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-primary text-lg text-white">Confirm Broadcast</h3>
                <p className="text-sm text-zinc-400 font-secondary">
                  {sendToAll
                    ? 'This will email all beta users'
                    : `This will email ${selectedEmails.size} selected user${selectedEmails.size !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-zinc-300 font-secondary mb-4">
                {sendToAll ? (
                  <>
                    You're about to send an email to <strong className="text-white">all {recipients.length} approved beta users</strong>.
                  </>
                ) : (
                  <>
                    You're about to send an email to <strong className="text-white">{selectedEmails.size} selected beta user{selectedEmails.size !== 1 ? 's' : ''}</strong>.
                  </>
                )}
              </p>

              <div className="p-3 bg-zinc-800/50 border border-zinc-700 mb-4">
                <p className="text-sm font-secondary text-zinc-400">
                  <span className="text-zinc-500">Subject:</span>{' '}
                  <span className="text-white">{subject}</span>
                </p>
                <p className="text-sm font-secondary text-zinc-400 mt-1">
                  <span className="text-zinc-500">Updates:</span>{' '}
                  <span className="text-white">{updates.length} section{updates.length > 1 ? 's' : ''}</span>
                </p>
                <p className="text-sm font-secondary text-zinc-400 mt-1">
                  <span className="text-zinc-500">Recipients:</span>{' '}
                  <span className="text-white">{recipientCount}</span>
                </p>
              </div>

              {/* Show selected users when in selected mode */}
              {!sendToAll && selectedEmails.size > 0 && selectedEmails.size <= 10 && (
                <div className="p-3 bg-zinc-800/30 border border-zinc-700/50 mb-4 max-h-32 overflow-y-auto">
                  <p className="text-xs font-secondary text-zinc-500 mb-1">Sending to:</p>
                  {Array.from(selectedEmails).map((email) => {
                    const r = recipients.find((rec) => rec.email === email);
                    return (
                      <p key={email} className="text-xs font-secondary text-zinc-400">
                        {r?.name ? `${r.name} — ` : ''}{email}
                      </p>
                    );
                  })}
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-sm font-secondary text-amber-300">
                <p>Make sure you've sent a test email first to verify the content looks correct.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendBroadcast}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-secondary text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send to {recipientCount}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaBroadcastSection;
