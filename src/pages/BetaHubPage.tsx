import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import {
  Users,
  ArrowRight,
  Loader2,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  MessageSquare,
  BarChart3,
  Zap,
  LogOut,
  User,
  Plus
} from 'lucide-react';

interface BetaFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  status: 'available' | 'coming-soon' | 'locked';
  isNew?: boolean;
}

const BetaHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    loading,
    isApproved,
    isPending,
    isRejected,
    isAdmin,
    betaApplication,
    hasProfile,
    profileStatus,
    error,
  } = useBetaAccess();

  // Redirect approved beta users directly to the directory
  // BetaHub is now just a redirect point - the directory is the main destination
  useEffect(() => {
    if (!loading && isApproved) {
      if (hasProfile) {
        navigate('/directory');
      } else {
        navigate('/directory/create');
      }
    }
  }, [loading, isApproved, hasProfile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/beta');
  };

  // Define available beta features
  const betaFeatures: BetaFeature[] = [
    {
      id: 'directory',
      title: 'CTC Directory',
      description: 'Browse and connect with creative technologists worldwide. Create your profile to be discovered.',
      icon: <Users className="h-6 w-6" />,
      href: '/directory',
      status: 'available',
      isNew: true,
    },
    {
      id: 'messaging',
      title: 'Direct Messaging',
      description: 'Connect directly with other members through our secure messaging system.',
      icon: <MessageSquare className="h-6 w-6" />,
      href: '/messages',
      status: 'available',
    },
    {
      id: 'ai-matching',
      title: 'AI Job Matching',
      description: 'Get matched with opportunities using our AI-powered job matching engine.',
      icon: <Zap className="h-6 w-6" />,
      status: 'coming-soon',
    },
    {
      id: 'analytics',
      title: 'Profile Analytics',
      description: 'See who viewed your profile and track your visibility in the network.',
      icon: <BarChart3 className="h-6 w-6" />,
      status: 'coming-soon',
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-zinc-400 font-secondary">Checking beta access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Lock className="h-12 w-12 text-zinc-600 mx-auto mb-6" />
          <h1 className="text-3xl font-primary font-medium mb-4">Beta Access Required</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            Sign in with your approved beta email to access the beta features.
          </p>
          <button
            onClick={() => navigate('/beta/auth')}
            className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center gap-2"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-zinc-600 font-secondary text-sm mt-6">
            Don't have access?{' '}
            <Link to="/beta" className="text-purple-400 hover:text-purple-300">
              Apply for beta
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // No beta application found AND no approved profile AND not an admin
  // Admins bypass beta application requirement
  if (!betaApplication && profileStatus !== 'approved' && !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-400/60 mx-auto mb-6" />
          <h1 className="text-3xl font-primary font-medium mb-4">No Beta Application Found</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            We couldn't find a beta application for {user.email}. You may need to apply for beta access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/beta')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center justify-center gap-2"
            >
              Apply for Beta
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-8 py-4 bg-zinc-900 text-white font-secondary text-sm tracking-wide hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 border border-zinc-800"
            >
              Sign Out
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application pending
  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Clock className="h-12 w-12 text-yellow-400/60 mx-auto mb-6" />
          <h1 className="text-3xl font-primary font-medium mb-4">Application Pending</h1>
          <p className="text-zinc-400 font-secondary mb-4">
            Hi {betaApplication.name}, your beta application is currently under review.
          </p>
          <p className="text-zinc-500 font-secondary text-sm mb-8">
            We'll notify you at {betaApplication.email} once your application has been approved.
          </p>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 mb-6">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wider mb-2">
              Applied on
            </p>
            <p className="text-zinc-300 font-secondary">
              {new Date(betaApplication.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-8 py-4 bg-zinc-900 text-white font-secondary text-sm tracking-wide hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 border border-zinc-800"
          >
            Sign Out
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Application rejected
  if (isRejected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-400/60 mx-auto mb-6" />
          <h1 className="text-3xl font-primary font-medium mb-4">Application Not Approved</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            Unfortunately, your beta application was not approved at this time. 
            If you believe this was an error, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center justify-center gap-2"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={handleSignOut}
              className="px-8 py-4 bg-zinc-900 text-white font-secondary text-sm tracking-wide hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 border border-zinc-800"
            >
              Sign Out
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get the user's display name from beta application or email
  const displayName = betaApplication?.name?.split(' ')[0] || user.email?.split('@')[0] || 'Member';

  // Approved - show the beta hub (either via beta application or approved profile)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-secondary tracking-[0.4em] text-purple-400 uppercase">
                  {betaApplication ? 'Beta Program' : 'CTC Member'}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                  {betaApplication ? 'EARLY ACCESS' : 'VERIFIED'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[0.95] tracking-tight">
                <span className="text-white">Welcome back,</span>
                <br />
                <span className="text-zinc-500">{displayName}</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <User className="h-4 w-4" />
                <span className="text-sm font-secondary">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Profile Status Banner */}
          {hasProfile ? (
            <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profileStatus === 'approved' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-secondary">Your profile is live in the directory</p>
                      <p className="text-xs text-zinc-500 font-secondary">
                        Other members can now discover and connect with you
                      </p>
                    </div>
                  </>
                ) : profileStatus === 'pending' ? (
                  <>
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-secondary">Your profile is pending approval</p>
                      <p className="text-xs text-zinc-500 font-secondary">
                        We'll notify you once it's reviewed by our team
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-white font-secondary">Profile needs updates</p>
                      <p className="text-xs text-zinc-500 font-secondary">
                        Please review and update your profile
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Link
                to="/directory/dashboard"
                className="px-4 py-2 text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
              >
                View Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-white font-secondary">Create your directory profile</p>
                  <p className="text-xs text-zinc-500 font-secondary">
                    Be discovered by teams and collaborators worldwide
                  </p>
                </div>
              </div>
              <Link
                to="/directory/create"
                className="px-4 py-2 bg-white text-black text-sm font-secondary hover:bg-zinc-100 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Profile
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Beta Features Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-secondary tracking-[0.3em] text-zinc-600 uppercase">
            Beta Features
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {betaFeatures.map((feature) => (
            <div
              key={feature.id}
              className={`group relative p-6 border transition-all duration-300 ${
                feature.status === 'available'
                  ? 'border-white/[0.06] hover:border-white/[0.12] bg-zinc-900/30 hover:bg-zinc-900/50 cursor-pointer'
                  : 'border-white/[0.04] bg-zinc-900/20 cursor-default opacity-60'
              }`}
              onClick={() => feature.status === 'available' && feature.href && navigate(feature.href)}
            >
              {/* Status Badge */}
              <div className="absolute top-6 right-6">
                {feature.isNew && feature.status === 'available' && (
                  <span className="px-2 py-0.5 text-[9px] font-secondary bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    NEW
                  </span>
                )}
                {feature.status === 'coming-soon' && (
                  <span className="px-2 py-0.5 text-[9px] font-secondary bg-zinc-800 text-zinc-500 border border-zinc-700 rounded">
                    COMING SOON
                  </span>
                )}
              </div>

              <div className={`mb-4 ${feature.status === 'available' ? 'text-white' : 'text-zinc-600'}`}>
                {feature.icon}
              </div>

              <h3 className={`text-xl font-primary font-medium mb-2 ${
                feature.status === 'available' ? 'text-white' : 'text-zinc-600'
              }`}>
                {feature.title}
              </h3>

              <p className={`font-secondary text-sm leading-relaxed mb-4 ${
                feature.status === 'available' ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {feature.description}
              </p>

              {feature.status === 'available' && (
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-white transition-colors">
                  <span className="text-sm font-secondary">Explore</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interests Section */}
        {betaApplication?.interests && betaApplication.interests.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-secondary tracking-[0.3em] text-zinc-600 uppercase">
                Your Interests
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {betaApplication.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-4 py-2 text-sm font-secondary text-zinc-400 bg-zinc-900/50 border border-zinc-800"
                >
                  {interest.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between">
            <p className="text-xs font-secondary text-zinc-600">
              {betaApplication ? (
                <>
                  Beta member since{' '}
                  {new Date(betaApplication.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </>
              ) : (
                <>CTC Directory Member</>
              )}
            </p>
            <Link
              to="/contact"
              className="text-xs font-secondary text-zinc-500 hover:text-white transition-colors"
            >
              Feedback & Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BetaHubPage;
