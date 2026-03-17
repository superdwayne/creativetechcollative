import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Users,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Key,
  MessageSquare,
  Building2,
  UserCircle,
  ExternalLink,
  Send,
  RotateCcw,
  Calendar,
  Clock,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserListItem {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  userType: 'member' | 'company' | 'unknown';
  status: 'active' | 'pending' | 'unverified';
  name: string;
  profile?: {
    id: string;
    fullName: string;
    approved: boolean;
    location: string;
  };
  company?: {
    id: string;
    companyName: string;
    verified: boolean;
    industry: string | null;
  };
}

interface ConversationSummary {
  conversationId: string;
  conversationType: 'direct' | 'job_match';
  participantId: string;
  participantName: string;
  participantEmail?: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSentByUser: boolean;
}

interface UserActivity {
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastSignIn: string | null;
  };
  profile?: {
    id: string;
    fullName: string;
    email: string;
    location: string;
    approved: boolean;
    createdAt: string;
  };
  company?: {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    verified: boolean;
    createdAt: string;
  };
  conversations: ConversationSummary[];
  stats: {
    totalConversations: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    directConversations: number;
    jobMatchConversations: number;
  };
}

interface UserStats {
  totalUsers: number;
  totalMembers: number;
  totalCompanies: number;
  pendingMembers: number;
  unverifiedCompanies: number;
}

interface Props {
  accessToken: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const UserManagementSection: React.FC<Props> = ({ accessToken, onToast }) => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'member' | 'company'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [sendingWelcomeId, setSendingWelcomeId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/users/list?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching users:', err);
      onToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, typeFilter, statusFilter, search, onToast]);

  const fetchUserActivity = useCallback(async (userId: string) => {
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/admin/users/activity?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user activity');
      }

      setUserActivity(data.activity);
    } catch (err) {
      console.error('Error fetching user activity:', err);
      onToast('Failed to fetch user activity', 'error');
    } finally {
      setLoadingActivity(false);
    }
  }, [accessToken, onToast]);

  const resetPassword = async (userId: string, email: string) => {
    setResettingPasswordId(userId);
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      onToast(`Password reset email sent to ${email}`, 'success');
    } catch (err) {
      console.error('Error resetting password:', err);
      onToast(err instanceof Error ? err.message : 'Failed to reset password', 'error');
    } finally {
      setResettingPasswordId(null);
    }
  };

  const sendWelcomeEmail = async (userId: string, userType: 'member' | 'company', email: string) => {
    setSendingWelcomeId(userId);
    try {
      const response = await fetch('/api/admin/users/send-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId, userType, includeLoginLink: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email');
      }

      onToast(`Welcome email sent to ${email}`, 'success');
    } catch (err) {
      console.error('Error sending welcome email:', err);
      onToast(err instanceof Error ? err.message : 'Failed to send welcome email', 'error');
    } finally {
      setSendingWelcomeId(null);
    }
  };

  const sendProfileReminder = async (userId: string, email: string) => {
    setSendingReminderId(userId);
    try {
      const response = await fetch('/api/admin/users/send-profile-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminder email');
      }

      onToast(`Profile completion reminder sent to ${email}`, 'success');
    } catch (err) {
      console.error('Error sending profile reminder:', err);
      onToast(err instanceof Error ? err.message : 'Failed to send reminder email', 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  const verifyCompany = async (companyId: string, companyName: string, verify: boolean = true) => {
    setVerifyingId(companyId);
    try {
      const response = await fetch('/api/admin/companies/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ companyId, verified: verify }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update company verification');
      }

      onToast(`${companyName} has been ${verify ? 'verified' : 'unverified'}`, 'success');
      
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error('Error verifying company:', err);
      onToast(err instanceof Error ? err.message : 'Failed to verify company', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const approveProfile = async (profileId: string, profileName: string) => {
    setApprovingId(profileId);
    try {
      const response = await fetch('/api/admin/profiles/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve profile');
      }

      onToast(`${profileName}'s profile has been approved`, 'success');
      
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error('Error approving profile:', err);
      onToast(err instanceof Error ? err.message : 'Failed to approve profile', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const viewUserActivity = async (user: UserListItem) => {
    setSelectedUser(user);
    setShowActivityModal(true);
    await fetchUserActivity(user.id);
  };

  const confirmDeleteUser = (user: UserListItem) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setDeletingUserId(userToDelete.id);
    console.log('[UserManagement] Attempting to delete user:', userToDelete.email, userToDelete.id);
    
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await response.json();
      console.log('[UserManagement] Delete response:', data);

      if (!response.ok) {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(errorMessage || 'Failed to delete user');
      }

      console.log('[UserManagement] User deleted successfully');
      onToast(`User ${userToDelete.email} has been deleted`, 'success');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setExpandedUserId(null);
      
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error('[UserManagement] Error deleting user:', err);
      onToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, userType: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      unverified: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };

    const label = status === 'active' 
      ? (userType === 'member' ? 'Approved' : 'Verified')
      : status === 'pending' 
        ? 'Pending Approval'
        : 'Unverified';

    return (
      <span className={cn('px-2 py-0.5 text-xs font-secondary border', statusColors[status] || statusColors.pending)}>
        {label}
      </span>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    const typeColors: Record<string, string> = {
      member: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      company: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      unknown: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };

    return (
      <span className={cn('px-2 py-0.5 text-xs font-secondary border', typeColors[userType] || typeColors.unknown)}>
        {userType === 'member' ? 'Member' : userType === 'company' ? 'Company' : 'Unknown'}
      </span>
    );
  };

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-zinc-500" />
          <h2 className="text-xl font-primary">User Management</h2>
          {stats && (
            <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary rounded-full">
              {stats.totalUsers} users
            </span>
          )}
        </div>
        <button
          onClick={() => fetchUsers()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-3 bg-zinc-900/50 border border-zinc-800">
            <p className="text-2xl font-primary text-white">{stats.totalUsers}</p>
            <p className="text-xs text-zinc-500 font-secondary">Total Users</p>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800">
            <p className="text-2xl font-primary text-blue-400">{stats.totalMembers}</p>
            <p className="text-xs text-zinc-500 font-secondary">Members</p>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800">
            <p className="text-2xl font-primary text-purple-400">{stats.totalCompanies}</p>
            <p className="text-xs text-zinc-500 font-secondary">Companies</p>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800">
            <p className="text-2xl font-primary text-yellow-400">{stats.pendingMembers}</p>
            <p className="text-xs text-zinc-500 font-secondary">Pending Members</p>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800">
            <p className="text-2xl font-primary text-orange-400">{stats.unverifiedCompanies}</p>
            <p className="text-xs text-zinc-500 font-secondary">Unverified Companies</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'member' | 'company')}
            className="bg-zinc-900 border border-zinc-800 text-white font-secondary text-sm px-3 py-2 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Types</option>
            <option value="member">Members</option>
            <option value="company">Companies</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'pending')}
          className="bg-zinc-900 border border-zinc-800 text-white font-secondary text-sm px-3 py-2 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active/Verified</option>
          <option value="pending">Pending/Unverified</option>
        </select>
      </div>

      {/* User List */}
      {loading ? (
        <div className="border border-zinc-800 p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="border border-zinc-800 p-8 text-center">
          <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-secondary">No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isExpanded = expandedUserId === user.id;

            return (
              <div key={user.id} className="border border-zinc-800 bg-zinc-900/30">
                {/* User Row */}
                <button
                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    {user.userType === 'company' ? (
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <Building2 className="h-5 w-5 text-purple-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <UserCircle className="h-5 w-5 text-zinc-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-primary text-white truncate">{user.name}</span>
                        {getUserTypeBadge(user.userType)}
                        {getStatusBadge(user.status, user.userType)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-zinc-500 font-secondary">
                        <span>{user.email}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(user.createdAt)}
                        </span>
                        {user.lastSignIn && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last login {formatDate(user.lastSignIn)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-500" />
                  )}
                </button>

                {/* Expanded Actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-zinc-800">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Verify Company - only for unverified companies */}
                      {user.userType === 'company' && user.company && !user.company.verified && (
                        <button
                          onClick={() => verifyCompany(user.company!.id, user.company!.companyName, true)}
                          disabled={verifyingId === user.company.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-secondary text-sm transition-colors disabled:opacity-50"
                        >
                          {verifyingId === user.company.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Verify Company
                        </button>
                      )}

                      {/* Unverify Company - only for verified companies */}
                      {user.userType === 'company' && user.company && user.company.verified && (
                        <button
                          onClick={() => verifyCompany(user.company!.id, user.company!.companyName, false)}
                          disabled={verifyingId === user.company.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-secondary text-sm transition-colors disabled:opacity-50"
                        >
                          {verifyingId === user.company.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          Unverify Company
                        </button>
                      )}

                      {/* Approve Profile - only for unapproved member profiles */}
                      {user.userType === 'member' && user.profile && !user.profile.approved && (
                        <button
                          onClick={() => approveProfile(user.profile!.id, user.profile!.fullName)}
                          disabled={approvingId === user.profile.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-secondary text-sm transition-colors disabled:opacity-50"
                        >
                          {approvingId === user.profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve Profile
                        </button>
                      )}

                      {/* Send Profile Reminder - only for unknown/unverified users */}
                      {user.userType === 'unknown' && user.status === 'unverified' && (
                        <button
                          onClick={() => sendProfileReminder(user.id, user.email)}
                          disabled={sendingReminderId === user.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-secondary text-sm transition-colors disabled:opacity-50"
                        >
                          {sendingReminderId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          Send Profile Reminder
                        </button>
                      )}

                      {/* Reset Password */}
                      <button
                        onClick={() => resetPassword(user.id, user.email)}
                        disabled={resettingPasswordId === user.id}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                      >
                        {resettingPasswordId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                        Reset Password
                      </button>

                      {/* Send Welcome Email */}
                      {user.userType !== 'unknown' && (
                        <button
                          onClick={() => sendWelcomeEmail(user.id, user.userType as 'member' | 'company', user.email)}
                          disabled={sendingWelcomeId === user.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-secondary text-sm transition-colors disabled:opacity-50"
                        >
                          {sendingWelcomeId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Welcome Email
                        </button>
                      )}

                      {/* View Activity */}
                      <button
                        onClick={() => viewUserActivity(user)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-secondary text-sm transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View Activity
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-secondary text-sm transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </button>
                    </div>

                    {/* User Details */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-secondary text-zinc-500">
                      <span className="px-2 py-1 bg-zinc-800/50 rounded">User ID: {user.id.slice(0, 8)}...</span>
                      {user.profile && <span className="px-2 py-1 bg-zinc-800/50 rounded">Profile ID: {user.profile.id.slice(0, 8)}...</span>}
                      {user.company && <span className="px-2 py-1 bg-zinc-800/50 rounded">Company ID: {user.company.id.slice(0, 8)}...</span>}
                    </div>

                    {/* Additional Info */}
                    {(user.profile || user.company) && (
                      <div className="mt-4 p-4 bg-zinc-800/30 border border-zinc-700/50">
                        {user.profile && (
                          <div className="text-sm font-secondary text-zinc-400">
                            <p><span className="text-zinc-500">Location:</span> {user.profile.location || 'Not set'}</p>
                            <p><span className="text-zinc-500">Profile Status:</span> {user.profile.approved ? 'Approved' : 'Pending Approval'}</p>
                          </div>
                        )}
                        {user.company && (
                          <div className="text-sm font-secondary text-zinc-400">
                            <p><span className="text-zinc-500">Industry:</span> {user.company.industry || 'Not set'}</p>
                            <p><span className="text-zinc-500">Company Status:</span> {user.company.verified ? 'Verified' : 'Unverified'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowActivityModal(false);
              setSelectedUser(null);
              setUserActivity(null);
            }}
          />

          {/* Modal */}
          <div className="relative bg-zinc-900 border border-zinc-700 w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div>
                <h3 className="font-primary text-xl text-white">User Activity</h3>
                <p className="text-sm text-zinc-400 font-secondary">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => {
                  setShowActivityModal(false);
                  setSelectedUser(null);
                  setUserActivity(null);
                }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : userActivity ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                      <p className="text-2xl font-primary text-white">{userActivity.stats.totalConversations}</p>
                      <p className="text-xs text-zinc-500 font-secondary">Conversations</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                      <p className="text-2xl font-primary text-green-400">{userActivity.stats.totalMessagesSent}</p>
                      <p className="text-xs text-zinc-500 font-secondary">Messages Sent</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                      <p className="text-2xl font-primary text-blue-400">{userActivity.stats.totalMessagesReceived}</p>
                      <p className="text-xs text-zinc-500 font-secondary">Messages Received</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                      <p className="text-2xl font-primary text-purple-400">{userActivity.stats.jobMatchConversations}</p>
                      <p className="text-xs text-zinc-500 font-secondary">Job Match Chats</p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-4 bg-zinc-800/30 border border-zinc-700">
                    <h4 className="font-primary text-sm text-zinc-300 mb-3">Account Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm font-secondary">
                      <div>
                        <span className="text-zinc-500">Email:</span>{' '}
                        <span className="text-white">{userActivity.user.email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Created:</span>{' '}
                        <span className="text-white">{formatDateTime(userActivity.user.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Last Sign In:</span>{' '}
                        <span className="text-white">
                          {userActivity.user.lastSignIn ? formatDateTime(userActivity.user.lastSignIn) : 'Never'}
                        </span>
                      </div>
                      {userActivity.profile && (
                        <div>
                          <span className="text-zinc-500">Profile:</span>{' '}
                          <span className={userActivity.profile.approved ? 'text-green-400' : 'text-yellow-400'}>
                            {userActivity.profile.approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      )}
                      {userActivity.company && (
                        <div>
                          <span className="text-zinc-500">Company:</span>{' '}
                          <span className={userActivity.company.verified ? 'text-green-400' : 'text-orange-400'}>
                            {userActivity.company.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversations */}
                  <div>
                    <h4 className="font-primary text-sm text-zinc-300 mb-3">Conversations ({userActivity.conversations.length})</h4>
                    {userActivity.conversations.length === 0 ? (
                      <div className="p-6 text-center border border-zinc-700 bg-zinc-800/30">
                        <MessageSquare className="h-10 w-10 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 font-secondary text-sm">No conversations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userActivity.conversations.map((conv) => (
                          <div key={conv.conversationId} className="p-3 bg-zinc-800/50 border border-zinc-700">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-primary text-white text-sm truncate">
                                    {conv.participantName}
                                  </span>
                                  <span className={cn(
                                    'px-2 py-0.5 text-xs font-secondary',
                                    conv.conversationType === 'direct' 
                                      ? 'bg-blue-500/20 text-blue-400' 
                                      : 'bg-purple-500/20 text-purple-400'
                                  )}>
                                    {conv.conversationType === 'direct' ? 'Direct' : 'Job Match'}
                                  </span>
                                  <span className="text-xs text-zinc-500 font-secondary">
                                    {conv.messageCount} messages
                                  </span>
                                </div>
                                {conv.participantEmail && (
                                  <p className="text-xs text-zinc-500 font-secondary mb-1">{conv.participantEmail}</p>
                                )}
                                <p className="text-sm text-zinc-400 font-secondary line-clamp-1">
                                  {conv.lastMessageSentByUser ? 'Sent: ' : 'Received: '}
                                  {conv.lastMessagePreview}
                                </p>
                              </div>
                              <span className="text-xs text-zinc-500 font-secondary whitespace-nowrap">
                                {formatDate(conv.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <AlertCircle className="h-8 w-8 text-zinc-500" />
                  <p className="ml-2 text-zinc-400 font-secondary">Failed to load activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!deletingUserId) {
                setShowDeleteModal(false);
                setUserToDelete(null);
              }
            }}
          />

          {/* Modal */}
          <div className="relative bg-zinc-900 border border-red-900/50 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-red-500/10">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-primary text-lg text-white">Delete User</h3>
                <p className="text-sm text-zinc-400 font-secondary">This action cannot be undone</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-zinc-300 font-secondary mb-4">
                Are you sure you want to permanently delete this user?
              </p>
              
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 mb-4">
                <div className="flex items-center gap-3">
                  {userToDelete.userType === 'company' ? (
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <Building2 className="h-5 w-5 text-purple-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <UserCircle className="h-5 w-5 text-zinc-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-primary text-white">{userToDelete.name}</p>
                    <p className="text-sm text-zinc-500 font-secondary">{userToDelete.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm font-secondary text-red-300">
                <p className="font-semibold mb-1">This will permanently delete:</p>
                <ul className="list-disc list-inside text-red-400 space-y-1">
                  <li>The user's account and login credentials</li>
                  {userToDelete.profile && <li>Their network profile</li>}
                  {userToDelete.company && <li>Their company and all posted jobs</li>}
                  <li>All messages and conversations</li>
                  <li>All job matches</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={!!deletingUserId}
                className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-secondary text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                disabled={!!deletingUserId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-secondary text-sm transition-colors disabled:opacity-50"
              >
                {deletingUserId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete User
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

export default UserManagementSection;
