import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Sparkles, Check, Star, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId } from '@/lib/supabase';

interface CreditBundle {
  id: 'basic' | 'popular' | 'pro';
  name: string;
  credits: number;
  price: number;
  pricePerAnalysis: string;
  isPopular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const bundles: CreditBundle[] = [
  {
    id: 'basic',
    name: 'Starter',
    credits: 10,
    price: 29,
    pricePerAnalysis: '2.90',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'emerald',
  },
  {
    id: 'popular',
    name: 'Growth',
    credits: 25,
    price: 59,
    pricePerAnalysis: '2.36',
    isPopular: true,
    icon: <Star className="w-6 h-6" />,
    color: 'violet',
  },
  {
    id: 'pro',
    name: 'Scale',
    credits: 50,
    price: 99,
    pricePerAnalysis: '1.98',
    icon: <Zap className="w-6 h-6" />,
    color: 'fuchsia',
  },
];

const PurchaseCreditsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingBundleId, setLoadingBundleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle success/canceled URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setToast({ message: 'Payment successful! Credits have been added to your account.', type: 'success' });
      // Clear params from URL without reload
      window.history.replaceState({}, '', '/company/purchase-credits');
    } else if (canceled === 'true') {
      setToast({ message: 'Payment canceled. No charges were made.', type: 'error' });
      window.history.replaceState({}, '', '/company/purchase-credits');
    }

    // Auto-hide toast after 5 seconds
    if (success || canceled) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch company_id for the current user
  useEffect(() => {
    async function fetchCompanyId() {
      if (!user?.id) {
        setLoadingCompany(false);
        return;
      }

      try {
        const company = await getCompanyByUserId(user.id);
        if (company) {
          setCompanyId(company.id);
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setLoadingCompany(false);
      }
    }

    fetchCompanyId();
  }, [user?.id]);

  const handleBuyNow = async (bundleId: 'basic' | 'popular' | 'pro') => {
    if (!companyId) {
      setToast({ message: 'Company not found. Please register your company first.', type: 'error' });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    setLoadingBundleId(bundleId);

    try {
      const response = await fetch('/api/company/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundle_id: bundleId,
          company_id: companyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to start checkout. Please try again.',
        type: 'error'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setLoadingBundleId(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Back Navigation */}
      <div className="mb-8">
        <Link
          to="/discover-talent"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Discover Talent</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 mb-6">
          <Sparkles className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Purchase Analysis Credits
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Unlock AI-powered job analysis to find the perfect candidates.
          Each credit gives you one comprehensive job analysis with candidate matching.
        </p>
      </div>

      {/* Bundle Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className={cn(
              'relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl',
              bundle.isPopular
                ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                : 'border-zinc-800/50'
            )}
          >
            {/* Popular Badge */}
            {bundle.isPopular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                Most Popular
              </div>
            )}

            {/* Card Content */}
            <div className="p-6">
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  bundle.color === 'emerald' && 'bg-emerald-500/20 text-emerald-400',
                  bundle.color === 'violet' && 'bg-violet-500/20 text-violet-400',
                  bundle.color === 'fuchsia' && 'bg-fuchsia-500/20 text-fuchsia-400'
                )}
              >
                {bundle.icon}
              </div>

              {/* Name */}
              <h3 className="text-xl font-semibold text-white mb-1">{bundle.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">{bundle.credits} analyses</p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${bundle.price}</span>
                  <span className="text-zinc-500">USD</span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  ${bundle.pricePerAnalysis} per analysis
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{bundle.credits} AI job analyses</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Candidate matching insights</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Credits never expire</span>
                </li>
              </ul>

              {/* Buy Button */}
              <button
                onClick={() => handleBuyNow(bundle.id)}
                disabled={loadingBundleId !== null || loadingCompany}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  bundle.isPopular
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white',
                  (loadingBundleId !== null || loadingCompany) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loadingBundleId === bundle.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Buy Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-zinc-500">
          Secure payment powered by Stripe. Credits are added instantly after purchase.
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 border font-secondary text-sm rounded-lg',
            toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PurchaseCreditsPage;
