import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  Users,
  LogOut,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  ArrowRight,
  Bot,
  Sparkles,
  MessageSquare,
  Send,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import { Company } from '@/types/job-matching';
import { getCompanyByUserId } from '@/lib/supabase';

interface MessageCredits {
  freeRemaining: number;
  purchasedRemaining: number;
  totalRemaining: number;
}

const CompanyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut, loading: authLoading } = useAuth();
  
  // Track user presence to avoid sending email notifications when they're active
  usePresence();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageCredits, setMessageCredits] = useState<MessageCredits | null>(null);
  const [totalMessagesSent, setTotalMessagesSent] = useState(0);

  const fetchMessageCredits = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/company/message-credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessageCredits(data.credits);
        setTotalMessagesSent(data.totalMessagesSent || 0);
      }
    } catch (err) {
      console.error('Error fetching message credits:', err);
    }
  }, [session?.access_token]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const companyData = await getCompanyByUserId(user.id);
      if (!companyData) {
        navigate('/company/register');
        return;
      }
      setCompany(companyData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/company/auth');
      return;
    }

    if (user) {
      fetchData();
      fetchMessageCredits();
    }
  }, [user, authLoading, navigate, fetchData, fetchMessageCredits]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No company found</p>
          <button
            onClick={() => navigate('/company/register')}
            className="px-6 py-3 bg-white text-black font-secondary text-sm"
          >
            Register Your Company
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/50 backdrop-blur-sm bg-black/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase hover:text-zinc-300 transition-colors">
              CTC Talent
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-white">Dashboard</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white text-sm transition-all hover:bg-zinc-800/50 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Company Header */}
        <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/5 via-transparent to-violet-500/5 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center border border-white/5">
                  <Building2 className="h-8 w-8 text-zinc-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{company.companyName}</h1>
                  <p className="text-zinc-400 text-sm">{company.contactName} • {company.contactEmail}</p>
                </div>
              </div>

              {company.verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Company
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message Credits Card */}
        {messageCredits && (
          <div className={`relative border rounded-2xl p-6 mb-8 ${
            messageCredits.totalRemaining === 0
              ? 'bg-red-500/5 border-red-500/30'
              : messageCredits.totalRemaining <= 5
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-zinc-900/50 border-zinc-800/50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  messageCredits.totalRemaining === 0
                    ? 'bg-red-500/20'
                    : messageCredits.totalRemaining <= 5
                    ? 'bg-amber-500/20'
                    : 'bg-violet-500/20'
                }`}>
                  <MessageSquare className={`h-5 w-5 ${
                    messageCredits.totalRemaining === 0
                      ? 'text-red-400'
                      : messageCredits.totalRemaining <= 5
                      ? 'text-amber-400'
                      : 'text-violet-400'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Message Credits</p>
                  <p className="text-xs text-zinc-500">
                    {totalMessagesSent} sent &middot; {messageCredits.totalRemaining} remaining
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    messageCredits.totalRemaining === 0
                      ? 'text-red-400'
                      : messageCredits.totalRemaining <= 5
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}>
                    {messageCredits.totalRemaining}
                  </p>
                  <p className="text-xs text-zinc-500">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-400">{totalMessagesSent}</p>
                  <p className="text-xs text-zinc-500">Sent</p>
                </div>
              </div>
            </div>

            {messageCredits.totalRemaining === 0 && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <Mail className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-300 font-medium">You've used all your message credits</p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    Contact the CTC team at{' '}
                    <a href="mailto:info@creativetechnologists.nl" className="underline hover:text-red-300">
                      info@creativetechnologists.nl
                    </a>{' '}
                    to top up your account.
                  </p>
                </div>
              </div>
            )}

            {messageCredits.totalRemaining > 0 && messageCredits.totalRemaining <= 5 && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <Send className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-400/80">
                  You're running low on message credits. Contact{' '}
                  <a href="mailto:info@creativetechnologists.nl" className="underline hover:text-amber-300">
                    info@creativetechnologists.nl
                  </a>{' '}
                  when you need more.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Browse Directory - Active */}
          <Link
            to="/directory"
            className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                <Users className="h-6 w-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Browse Directory</h3>
                <p className="text-sm text-zinc-500">Find creative technologists</p>
              </div>
              <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-zinc-400">
              Explore our network of skilled creative technologists, developers, and designers ready to bring your projects to life.
            </p>
          </Link>

          {/* CT Finder */}
          <Link
            to="/company/ct-finder"
            className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
          >
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/20">
                <Sparkles className="h-3 w-3" />
                AI Agent
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Bot className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">CT Finder</h3>
                <p className="text-sm text-zinc-500">AI-powered creative technologist search</p>
              </div>
              <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-zinc-400">
              Upload a job spec PDF and our AI agent will search the directory to find the best matching creative technologists.
            </p>
          </Link>

          {/* Purchase Credits - Coming Soon */}
          <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 opacity-60 cursor-not-allowed">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-full border border-violet-500/20">
                <Lock className="h-3 w-3" />
                Coming Soon
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Purchase Credits</h3>
                <p className="text-sm text-zinc-500">Unlock analysis features</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              Get analysis credits to unlock AI-powered candidate matching and detailed profile insights.
            </p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-pink-400 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Browse our talent directory</h3>
                <p className="text-sm text-zinc-500">Explore profiles of creative technologists in our network. Filter by skills, location, and expertise.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Use CT Finder</h3>
                <p className="text-sm text-zinc-500">Upload a job spec and our AI agent will search the directory to find your ideal creative technologists.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-zinc-500 text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-zinc-400">Connect and collaborate <span className="text-xs text-violet-400">(Coming Soon)</span></h3>
                <p className="text-sm text-zinc-600">Message matched candidates and start bringing your creative projects to life.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboardPage;
