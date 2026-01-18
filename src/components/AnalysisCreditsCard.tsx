import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, Clock, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditBalance {
  freeAnalysesRemaining: number;
  purchasedCredits: number;
  totalCredits: number;
}

interface UsageLogEntry {
  id: string;
  jobTitle: string;
  creditType: 'free' | 'purchased';
  createdAt: string;
}

interface CreditsData {
  success: true;
  credits: CreditBalance;
  totalAnalysesUsed: number;
  recentUsage: UsageLogEntry[];
}

interface AnalysisCreditsCardProps {
  companyId: string;
  className?: string;
}

export const AnalysisCreditsCard: React.FC<AnalysisCreditsCardProps> = ({
  companyId,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreditsData | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!companyId) {
        setError('Company ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/company/credits?company_id=${companyId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch credits');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching credits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load credits');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [companyId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div
        className={cn(
          'bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6',
          className
        )}
      >
        <div className="flex items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading credits...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'bg-zinc-900/50 border border-red-500/20 rounded-2xl p-6',
          className
        )}
      >
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { credits, totalAnalysesUsed, recentUsage } = data;
  const hasCredits = credits.totalCredits > 0;

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analysis Credits</h3>
              <p className="text-sm text-zinc-400">AI-powered job matching</p>
            </div>
          </div>
          <Link
            to="/company/purchase-credits"
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
              hasCredits
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
            )}
          >
            <CreditCard className="w-4 h-4" />
            {hasCredits ? 'Purchase More' : 'Buy Credits'}
          </Link>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400">
              {credits.freeAnalysesRemaining}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Free Credits</div>
          </div>
          <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
            <div className="text-2xl font-bold text-violet-400">
              {credits.purchasedCredits}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Purchased</div>
          </div>
          <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
            <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
              <TrendingUp className="w-5 h-5 text-zinc-500" />
              {totalAnalysesUsed}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Total Used</div>
          </div>
        </div>
      </div>

      {/* Recent Usage */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Analyses
        </h4>

        {recentUsage.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-500 text-sm">No analyses yet</p>
            <p className="text-zinc-600 text-xs mt-1">
              Your analysis history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentUsage.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{log.jobTitle}</p>
                  <p className="text-xs text-zinc-500">{formatDate(log.createdAt)}</p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-medium',
                    log.creditType === 'free'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-violet-500/20 text-violet-400'
                  )}
                >
                  {log.creditType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Credits Warning */}
      {credits.totalCredits > 0 && credits.totalCredits <= 2 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200">
              Running low on credits. Purchase more to continue analyzing jobs.
            </p>
          </div>
        </div>
      )}

      {/* No Credits State */}
      {credits.totalCredits === 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-200">
              No credits remaining. Purchase credits to use AI job analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCreditsCard;
