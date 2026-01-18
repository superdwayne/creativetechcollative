import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Sparkles, Check, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const handleBuyNow = (bundleId: string) => {
    // Placeholder action - will be connected to Stripe in US-010
    console.log('Purchase bundle:', bundleId);
    alert(`Coming soon: Purchase ${bundleId} bundle`);
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
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  bundle.isPopular
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                )}
              >
                <CreditCard className="w-4 h-4" />
                Buy Now
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
    </div>
  );
};

export default PurchaseCreditsPage;
