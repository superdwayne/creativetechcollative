import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Loader2,
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  ChevronLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  FileText,
  Paperclip,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Types
type ConversationType = 'job_match' | 'direct';

interface JobMatchConversation {
  type: 'job_match';
  matchId: string;
  jobId: string;
  jobTitle: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  participantType: 'company' | 'member';
  lastMessage: {
    content: string;
    createdAt: string;
    senderType: 'company' | 'member';
  } | null;
  unreadCount: number;
  createdAt: string;
}

interface DirectConversation {
  type: 'direct';
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    isOwn: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

type Conversation = JobMatchConversation | DirectConversation;

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderType?: 'company' | 'member';
  content: string;
  createdAt: string;
  readAt: string | null;
  editedAt: string | null;
  isOwn: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    url: string;
  }>;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  
  // Track user presence to avoid sending email notifications when they're active
  usePresence();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [userType, setUserType] = useState<'company' | 'member' | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  
  // Enhancement state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'direct'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Get conversation ID from selected conversation
  const getConversationId = (conv: Conversation) => {
    return conv.type === 'job_match' ? conv.matchId : conv.conversationId;
  };

  // Get initial selection from URL params
  useEffect(() => {
    const matchIdFromUrl = searchParams.get('matchId');
    const directIdFromUrl = searchParams.get('id');
    const typeFromUrl = searchParams.get('type');
    
    if (matchIdFromUrl || (directIdFromUrl && typeFromUrl === 'direct')) {
      setShowMobileConversations(false);
    }
  }, [searchParams]);

  // Fetch all conversations (both job match and direct)
  const fetchConversations = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      // Fetch job match conversations
      const jobMatchResponse = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const jobMatchData = await jobMatchResponse.json();

      // Fetch direct conversations
      const directResponse = await fetch('/api/messages/direct/conversations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const directData = await directResponse.json();

      // Combine and normalize conversations
      const allConversations: Conversation[] = [];

      if (jobMatchData.success) {
        setUserType(jobMatchData.userType);
        for (const conv of jobMatchData.conversations) {
          allConversations.push({
            type: 'job_match',
            ...conv,
          });
        }
      }

      if (directData.success) {
        setProfileId(directData.profileId);
        for (const conv of directData.conversations) {
          allConversations.push({
            type: 'direct',
            ...conv,
          });
        }
      }

      // Sort by last message date
      allConversations.sort((a, b) => {
        const aDate = a.lastMessage?.createdAt || a.createdAt;
        const bDate = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setConversations(allConversations);

      // Select conversation from URL if present
      const matchIdFromUrl = searchParams.get('matchId');
      const directIdFromUrl = searchParams.get('id');
      const typeFromUrl = searchParams.get('type');

      if (matchIdFromUrl) {
        const conv = allConversations.find(
          c => c.type === 'job_match' && c.matchId === matchIdFromUrl
        );
        if (conv) setSelectedConversation(conv);
      } else if (directIdFromUrl && typeFromUrl === 'direct') {
        const conv = allConversations.find(
          c => c.type === 'direct' && c.conversationId === directIdFromUrl
        );
        if (conv) setSelectedConversation(conv);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [session?.access_token, searchParams]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!session?.access_token || !selectedConversation) return;

    setLoadingMessages(true);

    try {
      let response;
      if (selectedConversation.type === 'job_match') {
        response = await fetch(`/api/messages/conversation?matchId=${selectedConversation.matchId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        response = await fetch(`/api/messages/direct/conversation?conversationId=${selectedConversation.conversationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }

      const data = await response.json();

      if (data.success) {
        // Normalize messages
        const normalizedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          conversationId: selectedConversation.type === 'job_match' ? msg.matchId : msg.conversationId,
          senderId: msg.senderId || msg.sender_id,
          senderName: msg.senderName,
          senderType: msg.senderType,
          content: msg.content,
          createdAt: msg.createdAt,
          readAt: msg.readAt,
          editedAt: msg.editedAt,
          isOwn: selectedConversation.type === 'job_match' 
            ? msg.senderType === userType 
            : msg.isOwn,
          attachments: msg.attachments || [],
        }));
        
        setMessages(normalizedMessages);
        
        // Update unread count
        setConversations(prev => 
          prev.map(conv => {
            if (getConversationId(conv) === getConversationId(selectedConversation)) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [session?.access_token, selectedConversation, userType]);

  // Fetch message templates
  const fetchTemplates = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/messages/templates', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, [session?.access_token]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && !user) {
      // Preserve the current URL so user can be redirected back after login
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/directory/auth?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (user && session) {
      fetchConversations();
      fetchTemplates();
    }
  }, [user, authLoading, session, navigate, fetchConversations, fetchTemplates]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!supabase || conversations.length === 0) return;

    // Subscribe to job match messages
    const jobMatchIds = conversations
      .filter((c): c is JobMatchConversation => c.type === 'job_match')
      .map(c => c.matchId);

    // Subscribe to direct messages
    const directConvIds = conversations
      .filter((c): c is DirectConversation => c.type === 'direct')
      .map(c => c.conversationId);

    const channels: any[] = [];

    // Job match messages channel
    if (jobMatchIds.length > 0) {
      const jobMatchChannel = supabase
        .channel('job-match-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMessage = payload.new as any;
            if (!jobMatchIds.includes(newMessage.match_id)) return;

            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.match_id,
              senderId: newMessage.sender_id,
              senderType: newMessage.sender_type,
              content: newMessage.content,
              createdAt: newMessage.created_at,
              readAt: newMessage.read_at,
              editedAt: newMessage.edited_at,
              isOwn: newMessage.sender_type === userType,
              attachments: [],
            };

            // Add to messages if viewing this conversation
            if (selectedConversation?.type === 'job_match' && 
                selectedConversation.matchId === newMessage.match_id) {
              setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
            }

            // Update conversation list
            updateConversationWithNewMessage(newMessage.match_id, 'job_match', newMessage);
          }
        )
        .subscribe();
      channels.push(jobMatchChannel);
    }

    // Direct messages channel
    if (directConvIds.length > 0) {
      const directChannel = supabase
        .channel('direct-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          (payload) => {
            const newMessage = payload.new as any;
            if (!directConvIds.includes(newMessage.conversation_id)) return;

            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              createdAt: newMessage.created_at,
              readAt: newMessage.read_at,
              editedAt: newMessage.edited_at,
              isOwn: newMessage.sender_id === profileId,
              attachments: [],
            };

            // Add to messages if viewing this conversation
            if (selectedConversation?.type === 'direct' && 
                selectedConversation.conversationId === newMessage.conversation_id) {
              setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
            }

            // Update conversation list
            updateConversationWithNewMessage(newMessage.conversation_id, 'direct', newMessage);
          }
        )
        .subscribe();
      channels.push(directChannel);
    }

    // Typing indicators channel
    const typingChannel = supabase
      .channel('typing-indicators')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as any;
            const currentConvId = selectedConversation 
              ? getConversationId(selectedConversation) 
              : null;
            
            if (indicator.conversation_id === currentConvId && 
                indicator.user_id !== user?.id) {
              setTypingUsers(prev => 
                prev.includes(indicator.user_id) ? prev : [...prev, indicator.user_id]
              );
              
              // Auto-remove after 5 seconds
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(id => id !== indicator.user_id));
              }, 5000);
            }
          } else if (payload.eventType === 'DELETE') {
            const indicator = payload.old as any;
            setTypingUsers(prev => prev.filter(id => id !== indicator.user_id));
          }
        }
      )
      .subscribe();
    channels.push(typingChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [conversations, selectedConversation, userType, profileId, user?.id]);

  // Update conversation list when new message arrives
  const updateConversationWithNewMessage = (convId: string, type: ConversationType, message: any) => {
    setConversations(prev => 
      prev.map(conv => {
        const matches = type === 'job_match' 
          ? conv.type === 'job_match' && conv.matchId === convId
          : conv.type === 'direct' && conv.conversationId === convId;

        if (matches) {
          const isViewing = selectedConversation && getConversationId(selectedConversation) === convId;
          const isFromOther = type === 'job_match' 
            ? message.sender_type !== userType
            : message.sender_id !== profileId;

          return {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: message.created_at,
              ...(type === 'job_match' 
                ? { senderType: message.sender_type }
                : { senderId: message.sender_id, isOwn: message.sender_id === profileId }
              ),
            },
            unreadCount: !isViewing && isFromOther 
              ? (conv.unreadCount || 0) + 1 
              : conv.unreadCount,
          } as Conversation;
        }
        return conv;
      }).sort((a, b) => {
        const aDate = a.lastMessage?.createdAt || a.createdAt;
        const bDate = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
    );
  };

  // Send message
  const handleSendMessage = async () => {
    if (!session?.access_token || !selectedConversation || !messageInput.trim() || sendingMessage) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSendingMessage(true);

    // Clear typing indicator
    sendTypingIndicator(false);

    try {
      let response;
      if (selectedConversation.type === 'job_match') {
        response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            matchId: selectedConversation.matchId,
            content,
          }),
        });
      } else {
        response = await fetch('/api/messages/direct/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId: selectedConversation.conversationId,
            content,
          }),
        });
      }

      const data = await response.json();

      if (!data.success) {
        setMessageInput(content);
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(content);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  // Send typing indicator
  const sendTypingIndicator = async (isTyping: boolean) => {
    if (!session?.access_token || !selectedConversation) return;

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversationId: getConversationId(selectedConversation),
          conversationType: selectedConversation.type === 'job_match' ? 'job_match' : 'direct',
          isTyping,
        }),
      });
    } catch (error) {
      // Ignore typing indicator errors
    }
  };

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    // Debounce typing indicator
    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      sendTypingIndicator(true);
      lastTypingRef.current = now;
    }

    // Clear typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 3000);
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!session?.access_token || !editingMessageId || !editContent.trim()) return;

    try {
      const response = await fetch('/api/messages/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messageId: editingMessageId,
          messageType: selectedConversation?.type === 'job_match' ? 'job_match' : 'direct',
          content: editContent.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === editingMessageId 
              ? { ...msg, content: editContent.trim(), editedAt: new Date().toISOString() }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error editing message:', error);
    } finally {
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messageId,
          messageType: selectedConversation?.type === 'job_match' ? 'job_match' : 'direct',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: '[Message deleted]', editedAt: null }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setShowMessageMenu(null);
    }
  };

  // Use template
  const handleUseTemplate = (template: MessageTemplate) => {
    setMessageInput(template.content);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter conversations by tab
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'jobs') return conv.type === 'job_match';
    if (activeTab === 'direct') return conv.type === 'direct';
    return true;
  });

  // Get total unread count
  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  const jobUnread = conversations.filter(c => c.type === 'job_match').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const directUnread = conversations.filter(c => c.type === 'direct').reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  if (authLoading || loadingConversations) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          <p className="text-zinc-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={userType === 'company' ? '/company/dashboard' : '/directory/dashboard'}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-pink-400" />
            <span className="text-sm font-medium">Messages</span>
            {totalUnread > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-xs">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Conversations Sidebar */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-zinc-800/50 flex flex-col",
          !showMobileConversations && "hidden md:flex"
        )}>
          {/* Tabs */}
          <div className="p-3 border-b border-zinc-800/50">
            <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeTab === 'all' 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                All {totalUnread > 0 && `(${totalUnread})`}
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1",
                  activeTab === 'jobs' 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Briefcase className="h-3 w-3" />
                Jobs {jobUnread > 0 && `(${jobUnread})`}
              </button>
              <button
                onClick={() => setActiveTab('direct')}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1",
                  activeTab === 'direct' 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Users className="h-3 w-3" />
                Direct {directUnread > 0 && `(${directUnread})`}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm mb-2">No conversations yet</p>
                <p className="text-zinc-600 text-xs">
                  {activeTab === 'direct' 
                    ? 'Start a conversation from a member profile'
                    : userType === 'company'
                    ? 'Start messaging your matched candidates'
                    : 'Companies will reach out about job opportunities'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {filteredConversations.map((conv) => {
                  const convId = getConversationId(conv);
                  const isSelected = selectedConversation && getConversationId(selectedConversation) === convId;
                  
                  return (
                    <button
                      key={convId}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowMobileConversations(false);
                      }}
                      className={cn(
                        "w-full p-4 text-left hover:bg-zinc-900/50 transition-colors",
                        isSelected && "bg-zinc-900/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {conv.participantAvatar ? (
                          <img
                            src={conv.participantAvatar}
                            alt={conv.participantName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center">
                            {conv.type === 'job_match' && conv.participantType === 'company' ? (
                              <Building2 className="h-5 w-5 text-zinc-400" />
                            ) : (
                              <User className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-white text-sm truncate">
                              {conv.participantName}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-xs text-zinc-500 flex-shrink-0">
                                {formatTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          
                          {/* Show job title for job match conversations */}
                          {conv.type === 'job_match' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Briefcase className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                              <span className="text-xs text-zinc-500 truncate">{conv.jobTitle}</span>
                            </div>
                          )}
                          
                          {/* Direct message indicator */}
                          {conv.type === 'direct' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3 text-violet-500/60 flex-shrink-0" />
                              <span className="text-xs text-violet-400/60">Direct message</span>
                            </div>
                          )}
                          
                          {conv.lastMessage && (
                            <p className="text-xs text-zinc-400 truncate mt-1">
                              {conv.type === 'job_match' 
                                ? conv.lastMessage.senderType === userType ? 'You: ' : ''
                                : conv.lastMessage.isOwn ? 'You: ' : ''}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={cn(
          "flex-1 flex flex-col",
          showMobileConversations && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-zinc-800/50 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileConversations(true)}
                  className="md:hidden p-2 -ml-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-zinc-400" />
                </button>
                
                {selectedConversation.participantAvatar ? (
                  <img
                    src={selectedConversation.participantAvatar}
                    alt={selectedConversation.participantName}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center">
                    {selectedConversation.type === 'job_match' && selectedConversation.participantType === 'company' ? (
                      <Building2 className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <User className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="font-medium text-white">{selectedConversation.participantName}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    {selectedConversation.type === 'job_match' ? (
                      <>
                        <Briefcase className="h-3 w-3" />
                        {selectedConversation.jobTitle}
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" />
                        Direct message
                      </>
                    )}
                  </p>
                </div>

                {/* View Profile Link */}
                {selectedConversation.type === 'direct' && (
                  <Link
                    to={`/directory/profile/${selectedConversation.participantId}`}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    View Profile
                  </Link>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-zinc-700 mb-4" />
                    <p className="text-zinc-400 mb-2">No messages yet</p>
                    <p className="text-zinc-600 text-sm">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const showTime = index === 0 || 
                        new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;
                      const isDeleted = message.content === '[Message deleted]';
                      
                      return (
                        <div key={message.id}>
                          {showTime && (
                            <div className="flex justify-center mb-4">
                              <span className="text-xs text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-full">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "flex group",
                            message.isOwn ? "justify-end" : "justify-start"
                          )}>
                            {/* Message actions for own messages */}
                            {message.isOwn && !isDeleted && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mr-2">
                                <div className="relative">
                                  <button
                                    onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4 text-zinc-500" />
                                  </button>
                                  {showMessageMenu === message.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditContent(message.content);
                                          setShowMessageMenu(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-sm text-left text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="w-full px-3 py-1.5 text-sm text-left text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5",
                              message.isOwn
                                ? "bg-pink-500/20 text-pink-50 rounded-br-md"
                                : "bg-zinc-800 text-zinc-100 rounded-bl-md",
                              isDeleted && "opacity-50 italic"
                            )}>
                              {/* Edit mode */}
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white resize-none"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(null);
                                        setEditContent('');
                                      }}
                                      className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleEditMessage}
                                      className="px-3 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  
                                  {/* Attachments */}
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                        >
                                          {att.fileType.startsWith('image/') ? (
                                            <ImageIcon className="h-4 w-4 text-zinc-400" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-zinc-400" />
                                          )}
                                          <span className="text-xs truncate">{att.fileName}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className={cn(
                                    "flex items-center gap-1.5 mt-1",
                                    message.isOwn ? "justify-end" : "justify-start"
                                  )}>
                                    <span className={cn(
                                      "text-xs",
                                      message.isOwn ? "text-pink-300/50" : "text-zinc-500"
                                    )}>
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                    {message.editedAt && (
                                      <span className="text-xs text-zinc-600">(edited)</span>
                                    )}
                                    {/* Read receipt */}
                                    {message.isOwn && (
                                      <span className="text-xs">
                                        {message.readAt ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5 text-zinc-500" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-2.5">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-zinc-800/50">
                {/* Templates */}
                {showTemplates && templates.length > 0 && (
                  <div className="mb-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg max-h-40 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500 font-medium">Templates</span>
                      <button
                        onClick={() => setShowTemplates(false)}
                        className="p-0.5 hover:bg-zinc-800 rounded"
                      >
                        <X className="h-3.5 w-3.5 text-zinc-500" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleUseTemplate(template)}
                          className="w-full text-left p-2 hover:bg-zinc-800 rounded text-sm"
                        >
                          <span className="font-medium text-zinc-300">{template.name}</span>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{template.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-end gap-3">
                  {/* Template button */}
                  {templates.length > 0 && (
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={cn(
                        "p-3 rounded-xl transition-all",
                        showTemplates ? "bg-pink-500/20 text-pink-400" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      )}
                      title="Message templates"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  )}
                  
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 resize-none text-sm"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      messageInput.trim() && !sendingMessage
                        ? "bg-pink-500 text-white hover:bg-pink-600"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    )}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">Select a conversation</p>
                <p className="text-zinc-600 text-sm">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close menus */}
      {(showMessageMenu || showTemplates) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowMessageMenu(null);
            setShowTemplates(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
