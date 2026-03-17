import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Search,
  MapPin,
  Compass,
  BarChart3,
  Paperclip,
  X,
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId } from '@/lib/supabase';
import { Company } from '@/types/job-matching';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ToolActivity {
  name: string;
  summary: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolActivity?: ToolActivity[];
  isStreaming?: boolean;
}

interface Attachment {
  fileName: string;
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CHAT PERSISTENCE
// ============================================================================

const STORAGE_KEY_PREFIX = 'ctc-ct-finder-chats';
const MAX_STORED_CHATS = 50;

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}-${userId}`;
}

function loadChatSessions(userId: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const sessions: ChatSession[] = JSON.parse(raw);
    return sessions
      .map(s => ({
        ...s,
        messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function saveChatSessions(userId: string, sessions: ChatSession[]) {
  try {
    const trimmed = sessions.slice(0, MAX_STORED_CHATS);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable
  }
}

function generateChatTitle(messages: Message[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'New Chat';
  const text = firstUserMsg.content.trim();
  return text.length > 60 ? text.substring(0, 57) + '...' : text;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUGGESTED_PROMPTS = [
  {
    icon: Search,
    label: 'Find React & Three.js developers',
    prompt: 'Find developers with React and Three.js skills who are available for work',
  },
  {
    icon: MapPin,
    label: 'London-based talent',
    prompt: 'Show me creative technologists based in London',
  },
  {
    icon: Compass,
    label: 'AR/VR specialists',
    prompt: 'Who specializes in immersive experiences and AR/VR?',
  },
  {
    icon: BarChart3,
    label: 'Directory overview',
    prompt: 'Give me an overview of the talent available in the CTC directory',
  },
];

const TOOL_ICONS: Record<string, string> = {
  search_directory: '🔍',
  filter_by_skills: '🎯',
  filter_by_focus_areas: '📂',
  filter_available_members: '✅',
  get_member_profile: '👤',
  list_directory_skills: '📊',
  list_directory_focus_areas: '🗂️',
  get_directory_stats: '📈',
};

// ============================================================================
// MARKDOWN RENDERER
// ============================================================================

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={cn(
            'space-y-1 my-2 ml-5',
            listType === 'ol' ? 'list-decimal' : 'list-disc'
          )}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-zinc-300 text-sm font-secondary">
              {renderInline(item)}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      let nextMatch: { index: number; length: number; node: React.ReactNode } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        const candidate = {
          index: boldMatch.index,
          length: boldMatch[0].length,
          node: (
            <strong key={key++} className="text-white font-medium">
              {boldMatch[1]}
            </strong>
          ),
        };
        if (!nextMatch || candidate.index < nextMatch.index) nextMatch = candidate;
      }

      if (linkMatch && linkMatch.index !== undefined) {
        const isInternal = linkMatch[2].startsWith('/');
          const candidate = {
          index: linkMatch.index,
          length: linkMatch[0].length,
          node: isInternal ? (
            <Link
              key={key++}
              to={linkMatch[2]}
              className="text-white underline underline-offset-2 hover:text-zinc-300"
            >
              {linkMatch[1]}
            </Link>
          ) : (
            <a
              key={key++}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-zinc-300"
            >
              {linkMatch[1]}
            </a>
          ),
        };
        if (!nextMatch || candidate.index < nextMatch.index) nextMatch = candidate;
      }

      if (!nextMatch) {
        parts.push(remaining);
        break;
      }

      if (nextMatch.index > 0) {
        parts.push(remaining.substring(0, nextMatch.index));
      }
      parts.push(nextMatch.node);
      remaining = remaining.substring(nextMatch.index + nextMatch.length);
    }

    return <>{parts}</>;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmed.substring(2));
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(orderedMatch[2]);
      continue;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={elements.length} className="text-white font-medium text-sm mt-4 mb-2 font-secondary text-balance">
          {renderInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={elements.length} className="text-white font-semibold text-base mt-4 mb-2 font-primary text-balance">
          {renderInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={elements.length} className="text-white font-bold text-lg mt-4 mb-2 font-primary text-balance">
          {renderInline(trimmed.substring(2))}
        </h2>
      );
    } else if (trimmed.startsWith('---')) {
      elements.push(<hr key={elements.length} className="border-white/[0.06] my-4" />);
    } else if (trimmed === '') {
      elements.push(<div key={elements.length} className="h-2" />);
    } else {
      elements.push(
        <p key={elements.length} className="text-zinc-300 text-sm font-secondary leading-relaxed text-pretty">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

// ============================================================================
// PDF TEXT EXTRACTION
// ============================================================================

function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(uint8Array);

        let text = '';

        const textMatches = rawText.match(/\(([^)]+)\)/g);
        if (textMatches) {
          text = textMatches
            .map(m => m.slice(1, -1))
            .filter(t => t.length > 1 && /[a-zA-Z]/.test(t))
            .join(' ');
        }

        const streamMatches = rawText.match(/stream\n([\s\S]*?)endstream/g);
        if (streamMatches) {
          const streamText = streamMatches
            .map(m => m.replace(/^stream\n/, '').replace(/endstream$/, ''))
            .map(c => c.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim())
            .filter(t => t.length > 20)
            .join('\n');
          if (streamText.length > text.length) text = streamText;
        }

        resolve(
          text.trim().length >= 50
            ? text.trim()
            : `[PDF: ${file.name}] Text extraction was limited. The content may be image-based or use complex encoding. Please paste the text manually for best results.`
        );
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

const CompanyCTFinderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesRef = useRef<Message[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const serverSaveInFlight = useRef(false);
  messagesRef.current = messages;
  sessionIdRef.current = currentSessionId;

  // ---------- Auth & Company ----------

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/company/auth');
      return;
    }

    if (user) {
      (async () => {
        try {
          const companyData = await getCompanyByUserId(user.id);
          if (!companyData) {
            navigate('/company/register');
            return;
          }
          setCompany(companyData);
        } catch (err) {
          console.error('Error fetching company:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, authLoading, navigate]);

  // ---------- Persist a conversation to localStorage ----------

  const persistChat = useCallback((
    userId: string,
    msgs: Message[],
    sessionId: string | null,
  ) => {
    const saveable = msgs
      .filter(m => m.content || m.role === 'user')
      .map(({ isStreaming, ...m }) => m);
    if (saveable.length === 0) return;

    const resolvedId = sessionId || crypto.randomUUID();
    const sessions = loadChatSessions(userId);
    const now = new Date().toISOString();
    const existing = sessions.find(s => s.id === resolvedId);

    const updated: ChatSession = existing
      ? { ...existing, messages: saveable as Message[], title: generateChatTitle(saveable as Message[]), updatedAt: now }
      : { id: resolvedId, title: generateChatTitle(saveable as Message[]), messages: saveable as Message[], createdAt: now, updatedAt: now };

    const next = [updated, ...sessions.filter(s => s.id !== resolvedId)];
    saveChatSessions(userId, next);
    return { sessions: next, sessionId: resolvedId };
  }, []);

  // ---------- Persist to server (fire-and-forget) ----------

  const persistChatToServer = useCallback(async (
    sessionId: string,
    title: string,
    msgs: Message[],
    accessToken: string,
  ) => {
    if (serverSaveInFlight.current) return;
    serverSaveInFlight.current = true;
    try {
      const cleanMessages = msgs
        .filter(m => m.content || m.role === 'user')
        .map(({ isStreaming, ...m }) => m);
      if (cleanMessages.length === 0) return;

      await fetch('/api/company/save-agent-chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId,
          title,
          messages: cleanMessages,
        }),
      });
    } catch {
      // Non-blocking — localStorage is the primary store
    } finally {
      serverSaveInFlight.current = false;
    }
  }, []);

  const deleteChatFromServer = useCallback(async (
    sessionId: string,
    accessToken: string,
  ) => {
    try {
      await fetch(`/api/company/save-agent-chat?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Non-blocking
    }
  }, []);

  // ---------- Load chat history on mount ----------

  useEffect(() => {
    if (user?.id) {
      const loaded = loadChatSessions(user.id);
      setChatSessions(loaded);
      if (loaded.length > 0) setSidebarOpen(true);
    }
  }, [user?.id]);

  // ---------- Auto-save after each completed exchange ----------

  useEffect(() => {
    if (!user?.id || messages.length === 0 || isThinking) return;

    const result = persistChat(user.id, messages, currentSessionId);
    if (result) {
      if (!currentSessionId) setCurrentSessionId(result.sessionId);
      setChatSessions(result.sessions);

      // Dual-write to server
      if (session?.access_token) {
        const saved = result.sessions.find(s => s.id === result.sessionId);
        if (saved) {
          persistChatToServer(result.sessionId, saved.title, messages, session.access_token);
        }
      }
    }
  }, [messages, isThinking, user?.id, currentSessionId, persistChat, session?.access_token, persistChatToServer]);

  // ---------- Save on unmount (catches mid-stream navigations) ----------

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    return () => {
      if (messagesRef.current.length > 0) {
        persistChat(userId, messagesRef.current, sessionIdRef.current);
      }
    };
  }, [user?.id, persistChat]);

  // ---------- Scroll to bottom on new messages ----------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------- Auto-resize textarea ----------

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  }, [input]);

  // ---------- Chat History Actions ----------

  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setAttachment(null);
    setInput('');
  }, []);

  const loadChat = useCallback((session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setAttachment(null);
    setInput('');
  }, []);

  const deleteChat = useCallback((sessionId: string) => {
    if (!user?.id) return;
    const next = chatSessions.filter(s => s.id !== sessionId);
    saveChatSessions(user.id, next);
    setChatSessions(next);
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    // Also delete from server
    if (session?.access_token) {
      deleteChatFromServer(sessionId, session.access_token);
    }
  }, [user?.id, currentSessionId, chatSessions, session?.access_token, deleteChatFromServer]);

  // ---------- File Upload ----------

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB');
      return;
    }

    setIsExtracting(true);
    try {
      const text = await extractTextFromPDF(file);
      setAttachment({ fileName: file.name, text });
    } catch {
      setAttachment({ fileName: file.name, text: `[Failed to extract text from ${file.name}]` });
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ---------- Send Message & Stream Response ----------

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isThinking || !session) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const currentAttachment = attachment;

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setIsThinking(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        toolActivity: [],
        isStreaming: true,
      },
    ]);

    try {
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/company/ct-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          attachmentText: currentAttachment?.text,
          companyId: company?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));

              switch (event.type) {
                case 'tool_activity':
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantId
                        ? {
                            ...m,
                            toolActivity: [
                              ...(m.toolActivity || []),
                              { name: event.name, summary: event.summary },
                            ],
                          }
                        : m
                    )
                  );
                  break;

                case 'text':
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantId ? { ...m, content: event.content } : m
                    )
                  );
                  break;

                case 'done':
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantId ? { ...m, isStreaming: false } : m
                    )
                  );
                  break;

                case 'error':
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: `Sorry, an error occurred: ${event.message}`,
                            isStreaming: false,
                          }
                        : m
                    )
                  );
                  break;
              }
            } catch {
              /* ignore malformed events */
            }
          }
        }

        // Ensure stream is finalized
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
      } else {
        // Fallback: JSON response
        const data = await response.json();
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: data.response, isStreaming: false }
              : m
          )
        );
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, session, attachment, messages, company?.id]);

  // ---------- Keyboard ----------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ---------- Loading States ----------

  if (authLoading || loading) {
    return (
      <div className="min-h-dvh bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-zinc-400" />
          <p className="text-zinc-500 text-sm font-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company?.verified) {
    return (
      <div className="min-h-dvh bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="size-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-primary font-medium mb-4 text-balance">Verification Required</h1>
          <p className="text-zinc-400 font-secondary mb-8 text-pretty">
            Your company account needs to be verified before you can use CT Finder.
            Please wait for admin approval.
          </p>
          <button
            onClick={() => navigate('/company/dashboard')}
            className="px-6 py-3 bg-white text-black font-secondary text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------- Render ----------

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-black flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/company/dashboard')}
              aria-label="Back to dashboard"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="h-4 w-px bg-zinc-800" />
            {chatSessions.length > 0 && (
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                aria-label={sidebarOpen ? 'Close chat history' : 'Open chat history'}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <Bot className="size-4 text-zinc-300" />
              </div>
              <div>
                <h1 className="text-sm font-medium text-white">CT Finder</h1>
                <p className="text-[10px] text-zinc-500 font-secondary text-pretty">AI-Powered Creative Technologist Search</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMessages && (
              <button
                onClick={startNewChat}
                className="px-4 py-2 text-xs font-secondary text-zinc-400 hover:text-white bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="size-3" />
                New Chat
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ===== Chat History Sidebar ===== */}
        {sidebarOpen && (
          <aside className="w-72 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between">
              <span className="text-xs font-secondary text-zinc-500 uppercase tracking-wider">History</span>
              <button
                onClick={startNewChat}
                aria-label="New chat"
                className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800/50 transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chatSessions.map(session => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    session.id === currentSessionId
                      ? 'bg-zinc-800/70 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  )}
                  onClick={() => loadChat(session)}
                >
                  <MessageSquare className="size-3.5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-secondary truncate">{session.title}</p>
                    <p className="text-[10px] text-zinc-600 font-secondary mt-0.5">
                      {formatRelativeDate(session.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteChat(session.id);
                    }}
                    aria-label="Delete chat"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <p className="text-xs text-zinc-600 font-secondary text-center py-6">No previous chats</p>
              )}
            </div>
          </aside>
        )}

        {/* ===== Main Chat Area ===== */}
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {!hasMessages ? (
          /* ===== Welcome State ===== */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                  <Sparkles className="size-8 text-zinc-300" />
                </div>
                <h2 className="text-3xl font-primary font-medium mb-3 text-balance">
                  Who are you looking for?
                </h2>
                <p className="text-zinc-400 font-secondary max-w-md mx-auto text-pretty">
                  Search the CTC directory using natural language. I can find creative technologists
                  by skills, location, availability, and more.
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {SUGGESTED_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.prompt)}
                    className="group flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <s.icon className="size-4 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0 transition-colors" />
                    <span className="text-sm font-secondary text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Recent Chats */}
              {chatSessions.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-secondary text-zinc-600 uppercase tracking-wider mb-3 text-center">
                    Recent conversations
                  </h3>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    {chatSessions.slice(0, 5).map(session => (
                      <button
                        key={session.id}
                        onClick={() => loadChat(session)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/30 border border-zinc-800/30 rounded-lg hover:border-zinc-700/50 hover:bg-zinc-800/30 transition-colors text-left group"
                      >
                        <MessageSquare className="size-3.5 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                        <span className="text-sm font-secondary text-zinc-500 group-hover:text-zinc-300 truncate flex-1 transition-colors">
                          {session.title}
                        </span>
                        <span className="text-[10px] font-secondary text-zinc-700 flex-shrink-0">
                          {formatRelativeDate(session.updatedAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== Chat Messages ===== */
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 max-w-4xl',
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'size-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border',
                    message.role === 'assistant'
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-zinc-800 border-zinc-700'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="size-4 text-zinc-300" />
                  ) : (
                    <User className="size-4 text-zinc-400" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'rounded-2xl px-5 py-4 max-w-[85%]',
                    message.role === 'assistant'
                      ? 'bg-zinc-900/60 border border-zinc-800/50'
                      : 'bg-zinc-800/60 border border-zinc-700/50'
                  )}
                >
                  {/* Tool Activity */}
                  {message.toolActivity && message.toolActivity.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {message.toolActivity.map((tool, i) => {
                        const isLast = i === message.toolActivity!.length - 1;
                        const stillRunning = message.isStreaming && isLast && !message.content;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="flex-shrink-0">
                              {TOOL_ICONS[tool.name] || '🔧'}
                            </span>
                            <span className="font-secondary">{tool.summary}</span>
                            {stillRunning && (
                              <Loader2 className="size-3 animate-spin flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {message.content && <div className="h-px bg-zinc-800/50 mt-2" />}
                    </div>
                  )}

                  {/* Content */}
                  {message.role === 'assistant' ? (
                    message.content ? (
                      renderMarkdown(message.content)
                    ) : message.isStreaming ? (
                      !(message.toolActivity && message.toolActivity.length > 0) && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin text-zinc-400" />
                          <span className="text-sm font-secondary text-zinc-400">Thinking...</span>
                        </div>
                      )
                    ) : null
                  ) : (
                    <p className="text-sm font-secondary text-zinc-200 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ===== Input Area ===== */}
        <div
          className={cn(
            'p-4 flex-shrink-0',
            hasMessages && 'border-t border-zinc-800/50'
          )}
        >
          <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {attachment && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg">
                  <FileText className="size-3.5 text-zinc-400" />
                  <span className="text-xs font-secondary text-zinc-300 truncate max-w-[200px]">
                    {attachment.fileName}
                  </span>
                  <button
                    onClick={() => setAttachment(null)}
                    aria-label="Remove attachment"
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            )}

            {isExtracting && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Loader2 className="size-3.5 animate-spin text-zinc-400" />
                <span className="text-xs font-secondary text-zinc-500">
                  Extracting PDF text...
                </span>
              </div>
            )}

            <div className="flex gap-3 items-end">
              {/* Attach Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isThinking || isExtracting}
                aria-label="Attach a PDF file"
                className="flex-shrink-0 size-10 flex items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Paperclip className="size-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasMessages
                    ? 'Ask a follow-up question...'
                    : "Describe the talent you're looking for..."
                }
                rows={1}
                className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm font-secondary text-white resize-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600 max-h-[150px]"
              />

              {/* Send Button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
                className={cn(
                  'flex-shrink-0 size-10 rounded-xl flex items-center justify-center transition-colors',
                  input.trim() && !isThinking
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                )}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCTFinderPage;
