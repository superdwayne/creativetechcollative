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
  SmilePlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Quick-pick emoji set for reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

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

interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean; // whether current user reacted with this emoji
}

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
  reactions?: MessageReaction[];
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
  const { tap, success: hapticSuccess, error: hapticError } = useHaptics();

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
  const [messageCreditError, setMessageCreditError] = useState<string | null>(null);
  const [messageCreditsRemaining, setMessageCreditsRemaining] = useState<number | null>(null);
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  
  // Enhancement state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'direct'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // message ID or null
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);
  
  // Stable refs so real-time callbacks always see fresh state
  const selectedConversationRef = useRef<Conversation | null>(null);
  const userTypeRef = useRef<'company' | 'member' | null>(null);
  const profileIdRef = useRef<string | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => { selectedConversationRef.current = selectedConversation; }, [selectedConversation]);
  useEffect(() => { userTypeRef.current = userType; }, [userType]);
  useEffect(() => { profileIdRef.current = profileId; }, [profileId]);

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
            conversationId: conv.id || conv.conversationId,
            participantId: conv.participant?.id || conv.participantId,
            participantName: conv.participant?.name || conv.participantName || 'Unknown',
            participantAvatar: conv.participant?.avatar || conv.participantAvatar || null,
            lastMessage: conv.lastMessage || null,
            unreadCount: conv.unreadCount || 0,
            createdAt: conv.createdAt || conv.updatedAt,
            updatedAt: conv.updatedAt,
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

  const fetchMessageCredits = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/company/message-credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessageCreditsRemaining(data.credits.totalRemaining);
      }
    } catch {
      // Not a company user or credits not initialized - ignore
    }
  }, [session?.access_token]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && !user) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/directory/auth?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (user && session) {
      fetchConversations();
      fetchTemplates();
      fetchMessageCredits();
    }
  }, [user, authLoading, session, navigate, fetchConversations, fetchTemplates, fetchMessageCredits]);

  // Fetch messages when conversation changes, then load reactions
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Fetch reactions after messages are loaded
  useEffect(() => {
    if (messages.length > 0 && selectedConversation && !loadingMessages) {
      const messageIds = messages.map(m => m.id);
      fetchReactionsForMessages(messageIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for new messages
  // This subscribes once when the user is authenticated and stays connected.
  // Callbacks use refs so they always see current state without re-subscribing.
  useEffect(() => {
    if (!supabase || !user) return;

    const channels: any[] = [];

    // Job match messages channel – listens for INSERTs and UPDATEs (edits/deletes)
    const jobMatchChannel = supabase
      .channel('rt-job-match-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;

          const message: Message = {
            id: newMessage.id,
            conversationId: newMessage.match_id,
            senderId: newMessage.sender_id,
            senderType: newMessage.sender_type,
            content: newMessage.content,
            createdAt: newMessage.created_at,
            readAt: newMessage.read_at,
            editedAt: newMessage.edited_at,
            isOwn: newMessage.sender_type === userTypeRef.current,
            attachments: [],
          };

          // Add to messages if viewing this conversation
          const sel = selectedConversationRef.current;
          if (sel?.type === 'job_match' && sel.matchId === newMessage.match_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }

          // Update conversation list
          updateConversationWithNewMessage(newMessage.match_id, 'job_match', newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updated = payload.new as any;

          // Update the message in-place if we're viewing this conversation
          const sel = selectedConversationRef.current;
          if (sel?.type === 'job_match' && sel.matchId === updated.match_id) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === updated.id
                  ? { ...msg, content: updated.content, editedAt: updated.edited_at, readAt: updated.read_at }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[RT] job-match-messages channel:', status);
      });
    channels.push(jobMatchChannel);

    // Direct messages channel – listens for INSERTs and UPDATEs (edits/deletes)
    const directChannel = supabase
      .channel('rt-direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as any;

          const message: Message = {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            createdAt: newMessage.created_at,
            readAt: newMessage.read_at,
            editedAt: newMessage.edited_at,
            isOwn: newMessage.sender_id === profileIdRef.current,
            attachments: [],
          };

          // Add to messages if viewing this conversation
          const sel = selectedConversationRef.current;
          if (sel?.type === 'direct' && sel.conversationId === newMessage.conversation_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }

          // Update conversation list
          updateConversationWithNewMessage(newMessage.conversation_id, 'direct', newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const updated = payload.new as any;

          // Update the message in-place if we're viewing this conversation
          const sel = selectedConversationRef.current;
          if (sel?.type === 'direct' && sel.conversationId === updated.conversation_id) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === updated.id
                  ? { ...msg, content: updated.content, editedAt: updated.edited_at, readAt: updated.read_at }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[RT] direct-messages channel:', status);
      });
    channels.push(directChannel);

    // Reactions channel – listens for INSERT and DELETE on message_reactions
    const reactionsChannel = supabase
      .channel('rt-message-reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const reaction = (payload.new || payload.old) as any;
          if (!reaction?.message_id) return;

          // Update the reaction on the relevant message in local state
          setMessages(prev => {
            const msgIndex = prev.findIndex(m => m.id === reaction.message_id);
            if (msgIndex === -1) return prev;

            const msg = prev[msgIndex];
            const reactions = [...(msg.reactions || [])];
            const emojiIdx = reactions.findIndex(r => r.emoji === reaction.emoji);

            if (payload.eventType === 'INSERT') {
              if (emojiIdx >= 0) {
                reactions[emojiIdx] = {
                  ...reactions[emojiIdx],
                  count: reactions[emojiIdx].count + 1,
                  reacted: reaction.user_id === user?.id ? true : reactions[emojiIdx].reacted,
                };
              } else {
                reactions.push({
                  emoji: reaction.emoji,
                  count: 1,
                  reacted: reaction.user_id === user?.id,
                });
              }
            } else if (payload.eventType === 'DELETE') {
              if (emojiIdx >= 0) {
                const updated = {
                  ...reactions[emojiIdx],
                  count: reactions[emojiIdx].count - 1,
                  reacted: reaction.user_id === user?.id ? false : reactions[emojiIdx].reacted,
                };
                if (updated.count <= 0) {
                  reactions.splice(emojiIdx, 1);
                } else {
                  reactions[emojiIdx] = updated;
                }
              }
            }

            const updated = [...prev];
            updated[msgIndex] = { ...msg, reactions };
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('[RT] message-reactions channel:', status);
      });
    channels.push(reactionsChannel);

    // Typing indicators channel
    const typingChannel = supabase
      .channel('rt-typing-indicators')
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
            const sel = selectedConversationRef.current;
            const currentConvId = sel ? getConversationId(sel) : null;
            
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
      .subscribe((status) => {
        console.log('[RT] typing-indicators channel:', status);
      });
    channels.push(typingChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
    // Only re-subscribe when the user changes (login/logout), NOT on
    // conversation changes – the callbacks read refs for fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Update conversation list when new message arrives
  // Note: message may use camelCase (from API responses) or snake_case (from realtime)
  const updateConversationWithNewMessage = (convId: string, type: ConversationType, message: any) => {
    const msgCreatedAt = message.createdAt || message.created_at || new Date().toISOString();
    const msgSenderType = message.senderType || message.sender_type;
    const msgSenderId = message.senderId || message.sender_id;

    setConversations(prev => 
      prev.map(conv => {
        const matches = type === 'job_match' 
          ? conv.type === 'job_match' && conv.matchId === convId
          : conv.type === 'direct' && conv.conversationId === convId;

        if (matches) {
          const isViewing = selectedConversation && getConversationId(selectedConversation) === convId;
          const isFromOther = type === 'job_match' 
            ? msgSenderType !== userType
            : msgSenderId !== profileId;

          return {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: msgCreatedAt,
              ...(type === 'job_match' 
                ? { senderType: msgSenderType }
                : { senderId: msgSenderId, isOwn: msgSenderId === profileId }
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

    // Reset textarea height after clearing
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

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

      if (data.success && data.message) {
        hapticSuccess();
        // Optimistically add the sent message to the local state
        const sentMessage: Message = {
          id: data.message.id,
          conversationId: data.message.conversationId || data.message.matchId || selectedConversation.type === 'direct' ? (selectedConversation as any).conversationId : (selectedConversation as any).matchId,
          senderId: data.message.senderId || data.message.sender_id || '',
          senderName: data.message.senderName,
          senderType: data.message.senderType,
          content: data.message.content,
          createdAt: data.message.createdAt || data.message.created_at || new Date().toISOString(),
          readAt: null,
          editedAt: null,
          isOwn: true,
          attachments: [],
        };

        setMessages(prev => {
          // Avoid duplicates (in case real-time also fires)
          if (prev.some(m => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });

        // Update conversation list with last message
        updateConversationWithNewMessage(
          selectedConversation.type === 'direct' 
            ? (selectedConversation as any).conversationId 
            : (selectedConversation as any).matchId,
          selectedConversation.type,
          data.message
        );
        // Decrement local credit counter for company users
        if (userType === 'company' && messageCreditsRemaining !== null) {
          setMessageCreditsRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);
        }
      } else if (!data.success) {
        hapticError();
        setMessageInput(content);
        if (data.code === 'NO_MESSAGE_CREDITS') {
          setMessageCreditError('NO_MESSAGE_CREDITS');
          setMessageCreditsRemaining(0);
        } else {
          console.error('Failed to send message:', data.error);
        }
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

  // Auto-resize textarea to fit content
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    // Reset height to auto so scrollHeight recalculates properly
    textarea.style.height = 'auto';
    // Clamp between min (44px = ~1 row) and max (160px = ~6 rows)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    autoResizeTextarea(e.target);

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

  // Edit message (optimistic update – UI updates immediately, reverts on failure)
  const handleEditMessage = async () => {
    if (!session?.access_token || !editingMessageId || !editContent.trim()) return;

    const trimmedContent = editContent.trim();
    const messageId = editingMessageId;

    // Capture original content for rollback
    const originalMessage = messages.find(m => m.id === messageId);
    const originalContent = originalMessage?.content ?? '';
    const originalEditedAt = originalMessage?.editedAt ?? null;

    // Optimistic update – show the edit immediately
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: trimmedContent, editedAt: new Date().toISOString() }
          : msg
      )
    );

    // Clear editing state right away so the UI feels snappy
    setEditingMessageId(null);
    setEditContent('');

    try {
      const response = await fetch('/api/messages/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messageId,
          messageType: selectedConversation?.type === 'job_match' ? 'job_match' : 'direct',
          content: trimmedContent,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Edit failed, reverting:', data.error);
        // Revert on failure
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: originalContent, editedAt: originalEditedAt }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error editing message:', error);
      // Revert on network error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: originalContent, editedAt: originalEditedAt }
            : msg
        )
      );
    }
  };

  // Delete message (optimistic update)
  const handleDeleteMessage = async (messageId: string) => {
    if (!session?.access_token) return;

    // Capture original for rollback
    const originalMessage = messages.find(m => m.id === messageId);
    const originalContent = originalMessage?.content ?? '';
    const originalEditedAt = originalMessage?.editedAt ?? null;

    // Optimistic update
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: '[Message deleted]', editedAt: null }
          : msg
      )
    );
    setShowMessageMenu(null);

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
      if (!data.success) {
        console.error('Delete failed, reverting:', data.error);
        // Revert on failure
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: originalContent, editedAt: originalEditedAt }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      // Revert on network error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: originalContent, editedAt: originalEditedAt }
            : msg
        )
      );
    }
  };

  // Toggle reaction on a message
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!session?.access_token || !selectedConversation) return;
    tap();

    const messageType = selectedConversation.type === 'job_match' ? 'job_match' : 'direct';

    // Optimistic update
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const reactions = [...(msg.reactions || [])];
        const existingIdx = reactions.findIndex(r => r.emoji === emoji);

        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          if (existing.reacted) {
            // Remove own reaction
            if (existing.count <= 1) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = { ...existing, count: existing.count - 1, reacted: false };
            }
          } else {
            // Add own reaction
            reactions[existingIdx] = { ...existing, count: existing.count + 1, reacted: true };
          }
        } else {
          // New emoji reaction
          reactions.push({ emoji, count: 1, reacted: true });
        }

        return { ...msg, reactions };
      })
    );

    setShowEmojiPicker(null);

    try {
      await fetch('/api/messages/reactions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messageId, messageType, emoji }),
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Revert on error by refetching reactions
      fetchReactionsForMessages(messages.map(m => m.id));
    }
  };

  // Fetch reactions for a set of message IDs
  const fetchReactionsForMessages = useCallback(async (messageIds: string[]) => {
    if (!session?.access_token || !selectedConversation || messageIds.length === 0) return;

    const messageType = selectedConversation.type === 'job_match' ? 'job_match' : 'direct';

    try {
      const response = await fetch(
        `/api/messages/reactions?messageIds=${messageIds.join(',')}&messageType=${messageType}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setMessages(prev =>
          prev.map(msg => ({
            ...msg,
            reactions: data.reactions[msg.id] || [],
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [session?.access_token, selectedConversation]);

  // Use template
  const handleUseTemplate = (template: MessageTemplate) => {
    setMessageInput(template.content);
    setShowTemplates(false);
    // Resize textarea to fit template content after state update
    setTimeout(() => {
      autoResizeTextarea(inputRef.current);
      inputRef.current?.focus();
    }, 0);
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
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
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
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
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
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/50">
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
            <MessageSquare className="h-5 w-5 text-white" />
            <span className="text-sm font-medium">Messages</span>
            {totalUnread > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-black text-xs font-medium">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full min-h-0">
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
                          <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
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
                              <Users className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                              <span className="text-xs text-zinc-500">Direct message</span>
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
                          <span className="w-5 h-5 rounded-full bg-white text-black text-xs font-medium flex items-center justify-center flex-shrink-0">
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
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
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
                      const currTime = new Date(message.createdAt).getTime();
                      const prevTime = index > 0 ? new Date(messages[index - 1].createdAt).getTime() : 0;
                      const showTime = index === 0 || 
                        isNaN(currTime) || isNaN(prevTime) || (currTime - prevTime > 300000);
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
                              <div className={cn(
                                "transition-opacity flex items-center mr-2",
                                showMessageMenu === message.id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              )}>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowMessageMenu(showMessageMenu === message.id ? null : message.id);
                                    }}
                                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4 text-zinc-500" />
                                  </button>
                                  {showMessageMenu === message.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-1 z-[60] min-w-[120px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMessage(message.id);
                                        }}
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

                            {/* Emoji reaction button for OTHER people's messages (shown on left side) */}
                            {!message.isOwn && !isDeleted && (
                              <div className={cn(
                                "transition-opacity flex items-center mr-1.5 self-start mt-1",
                                showEmojiPicker === message.id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              )}>
                                <div className="relative">
                                  <button
                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                    className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                                    title="React"
                                  >
                                    <SmilePlus className="h-3.5 w-3.5 text-zinc-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="max-w-[75%] relative">
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5",
                                message.isOwn
                                  ? "bg-white rounded-br-md"
                                  : "bg-zinc-800/80 rounded-bl-md",
                                isDeleted && "opacity-50 italic"
                              )}
                              style={{ color: message.isOwn ? '#18181b' : '#f4f4f5' }}
                            >
                              {/* Edit mode */}
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 border rounded-lg text-sm resize-none",
                                      message.isOwn
                                        ? "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500"
                                        : "bg-zinc-900 border-zinc-700 text-white"
                                    )}
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(null);
                                        setEditContent('');
                                      }}
                                      className={cn(
                                        "px-3 py-1 text-xs transition-colors",
                                        message.isOwn ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-white"
                                      )}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleEditMessage}
                                      className={cn(
                                        "px-3 py-1 text-xs rounded font-medium transition-colors",
                                        message.isOwn
                                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                          : "bg-white text-black hover:bg-zinc-200"
                                      )}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span
                                    className="block text-sm whitespace-pre-wrap break-words"
                                    style={{ color: message.isOwn ? '#18181b' : '#f4f4f5' }}
                                  >{message.content}</span>
                                  
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
                                      message.isOwn ? "text-zinc-400" : "text-zinc-500"
                                    )}>
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                    {message.editedAt && (
                                      <span className={cn(
                                        "text-xs",
                                        message.isOwn ? "text-zinc-400" : "text-zinc-600"
                                      )}>(edited)</span>
                                    )}
                                    {/* Read receipt */}
                                    {message.isOwn && (
                                      <span className="text-xs">
                                        {message.readAt ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-zinc-500" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5 text-zinc-400" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Reaction pills */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className={cn(
                                "flex flex-wrap gap-1 mt-1",
                                message.isOwn ? "justify-end" : "justify-start"
                              )}>
                                {message.reactions.map((reaction) => (
                                  <button
                                    key={reaction.emoji}
                                    onClick={() => handleToggleReaction(message.id, reaction.emoji)}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border",
                                      reaction.reacted
                                        ? "bg-white/10 border-white/20 text-white"
                                        : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600"
                                    )}
                                    title={reaction.reacted ? 'Click to remove reaction' : 'Click to react'}
                                  >
                                    <span className="text-sm leading-none">{reaction.emoji}</span>
                                    {reaction.count > 1 && (
                                      <span className="text-[10px] font-medium tabular-nums">{reaction.count}</span>
                                    )}
                                  </button>
                                ))}
                                {/* Quick add reaction button inline with existing reactions */}
                                {!isDeleted && (
                                  <button
                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-zinc-800/40 border border-zinc-700/30 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
                                    title="Add reaction"
                                  >
                                    <SmilePlus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Emoji Picker Popover */}
                            {showEmojiPicker === message.id && (
                              <div className={cn(
                                "absolute z-[60] mt-1",
                                message.isOwn ? "right-0" : "left-0"
                              )}>
                                <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-2 flex gap-1 flex-wrap max-w-[240px]">
                                  {QUICK_EMOJIS.map((emoji) => {
                                    const alreadyReacted = message.reactions?.some(
                                      r => r.emoji === emoji && r.reacted
                                    );
                                    return (
                                      <button
                                        key={emoji}
                                        onClick={() => handleToggleReaction(message.id, emoji)}
                                        className={cn(
                                          "w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all hover:scale-110",
                                          alreadyReacted
                                            ? "bg-white/10 ring-1 ring-white/20"
                                            : "hover:bg-zinc-800"
                                        )}
                                        title={alreadyReacted ? 'Remove reaction' : 'React'}
                                      >
                                        {emoji}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            </div>{/* end max-w-[75%] wrapper */}

                            {/* Emoji reaction button for OWN messages (shown on right side) */}
                            {message.isOwn && !isDeleted && (
                              <div className={cn(
                                "transition-opacity flex items-center ml-1.5 self-start mt-1",
                                showEmojiPicker === message.id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              )}>
                                <button
                                  onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                  className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                                  title="React"
                                >
                                  <SmilePlus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
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
              <div className="border-t border-zinc-800/50">
                {/* Templates dropdown */}
                {showTemplates && templates.length > 0 && (
                  <div className="mx-4 mt-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg max-h-40 overflow-y-auto">
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

                {/* Message credit error banner */}
                {messageCreditError && (
                  <div className="mx-3 mt-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <MessageSquare className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-300">No message credits remaining</p>
                          <p className="text-xs text-red-400/80 mt-1">
                            You've used all your available messages. To continue messaging talent, please contact the CTC team to top up your account.
                          </p>
                          <a
                            href="mailto:info@creativetechnologists.nl?subject=Message%20Credit%20Top%20Up%20Request"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-xs font-medium text-red-300 hover:text-red-200 transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            Contact CTC Team
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => setMessageCreditError(null)}
                        className="shrink-0 text-red-400/60 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Low credits warning */}
                {userType === 'company' && messageCreditsRemaining !== null && messageCreditsRemaining > 0 && messageCreditsRemaining <= 5 && !messageCreditError && (
                  <div className="mx-3 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-400">
                      {messageCreditsRemaining} message{messageCreditsRemaining === 1 ? '' : 's'} remaining.{' '}
                      <a href="mailto:info@creativetechnologists.nl" className="underline hover:text-amber-300">Contact CTC</a> to top up.
                    </p>
                  </div>
                )}

                {/* Input row */}
                <div className="p-3">
                  <div className="flex items-end gap-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl focus-within:border-zinc-600 transition-colors">
                    {/* Template button */}
                    {templates.length > 0 && (
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={cn(
                          "shrink-0 p-2.5 ml-1 mb-0.5 rounded-xl transition-all",
                          showTemplates ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                        title="Message templates"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    )}

                    {/* Textarea */}
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        userType === 'company' && messageCreditsRemaining === 0
                          ? "No message credits remaining..."
                          : "Type a message..."
                      }
                      disabled={userType === 'company' && messageCreditsRemaining === 0}
                      rows={1}
                      className={cn(
                        "flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none resize-none text-sm leading-relaxed py-3",
                        templates.length === 0 && "pl-4",
                        userType === 'company' && messageCreditsRemaining === 0 && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ height: '44px', maxHeight: '160px', overflowY: messageInput.split('\n').length > 6 ? 'auto' : 'hidden' }}
                    />

                    {/* Send button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage || (userType === 'company' && messageCreditsRemaining === 0)}
                      className={cn(
                        "shrink-0 p-2.5 mr-1 mb-0.5 rounded-xl transition-all",
                        messageInput.trim() && !sendingMessage && !(userType === 'company' && messageCreditsRemaining === 0)
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "text-zinc-600 cursor-not-allowed"
                      )}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Hint text */}
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <p className="text-[11px] text-zinc-600">
                      <kbd className="px-1 py-0.5 rounded bg-zinc-800/60 text-zinc-500 font-mono text-[10px]">Enter</kbd> to send
                      {' · '}
                      <kbd className="px-1 py-0.5 rounded bg-zinc-800/60 text-zinc-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
                    </p>
                    <div className="flex items-center gap-2">
                      {userType === 'company' && messageCreditsRemaining !== null && (
                        <span className={cn(
                          "text-[11px] tabular-nums",
                          messageCreditsRemaining === 0
                            ? "text-red-400"
                            : messageCreditsRemaining <= 5
                            ? "text-amber-400"
                            : "text-zinc-500"
                        )}>
                          {messageCreditsRemaining} credit{messageCreditsRemaining === 1 ? '' : 's'}
                        </span>
                      )}
                      {messageInput.length > 100 && (
                        <span className={cn(
                          "text-[11px] tabular-nums",
                          messageInput.length > 1800 ? "text-amber-500" : "text-zinc-600"
                        )}>
                          {messageInput.length.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
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
      {(showMessageMenu || showTemplates || showEmojiPicker) && (
        <div 
          className="fixed inset-0 z-[50]" 
          onClick={() => {
            setShowMessageMenu(null);
            setShowTemplates(false);
            setShowEmojiPicker(null);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
