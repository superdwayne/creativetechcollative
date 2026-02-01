import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { messageNotificationEmail, EMAIL_FROM_DOMAIN } from '../lib/email-templates.js';

export const config = {
  runtime: 'edge',
};

/**
 * Parse URL path segments from request
 */
function getPathSegments(req: Request): string[] {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/messages/', '').replace(/^\/+|\/+$/g, '');
  return path ? path.split('/') : [];
}

/**
 * Parse query parameters from request
 */
function getQueryParams(req: Request): URLSearchParams {
  const url = new URL(req.url);
  return url.searchParams;
}

/**
 * JSON response helper
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Authenticate user from request
 */
async function authenticateUser(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authentication required' };
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { user: null, error: 'Invalid authentication token' };
  }

  return { user };
}

/**
 * Send email via Resend
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Creative Technology Collective <noreply@${EMAIL_FROM_DOMAIN}>`,
        to: [to],
        subject,
        html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// CONVERSATIONS HANDLERS (Job Match Messages)
// ============================================================================

async function handleConversationsList(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Determine if user is a company or member
  const { data: company } = await supabase
    .from('companies')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id, full_name, profile_picture_url')
    .eq('user_id', user.id)
    .single();

  const isCompany = !!company;
  const isMember = !!profile;

  if (!isCompany && !isMember) {
    return jsonResponse({ success: true, conversations: [] });
  }

  const conversations: any[] = [];

  if (isCompany) {
    const { data: matches } = await supabase
      .from('job_matches')
      .select(`
        id,
        created_at,
        job_submissions!inner (id, title, company_id),
        network_profiles!inner (id, full_name, profile_picture_url)
      `)
      .eq('job_submissions.company_id', company.id)
      .eq('admin_approved', true)
      .order('created_at', { ascending: false });

    for (const match of matches || []) {
      const jobSubmission = match.job_submissions as any;
      const memberProfile = match.network_profiles as any;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, sender_type')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .eq('sender_type', 'member')
        .is('read_at', null);

      conversations.push({
        matchId: match.id,
        jobId: jobSubmission.id,
        jobTitle: jobSubmission.title,
        participantId: memberProfile.id,
        participantName: memberProfile.full_name,
        participantAvatar: memberProfile.profile_picture_url,
        participantType: 'member',
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.created_at,
          senderType: lastMsg.sender_type,
        } : null,
        unreadCount: unreadCount || 0,
        createdAt: match.created_at,
      });
    }
  } else if (isMember) {
    const { data: matches } = await supabase
      .from('job_matches')
      .select(`
        id,
        created_at,
        job_submissions!inner (id, title, companies!inner (id, company_name))
      `)
      .eq('profile_id', profile.id)
      .eq('admin_approved', true)
      .order('created_at', { ascending: false });

    for (const match of matches || []) {
      const jobSubmission = match.job_submissions as any;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, sender_type')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .eq('sender_type', 'company')
        .is('read_at', null);

      conversations.push({
        matchId: match.id,
        jobId: jobSubmission.id,
        jobTitle: jobSubmission.title,
        participantId: jobSubmission.companies.id,
        participantName: jobSubmission.companies.company_name,
        participantAvatar: null,
        participantType: 'company',
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.created_at,
          senderType: lastMsg.sender_type,
        } : null,
        unreadCount: unreadCount || 0,
        createdAt: match.created_at,
      });
    }
  }

  conversations.sort((a, b) => {
    const aDate = a.lastMessage?.createdAt || a.createdAt;
    const bDate = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return jsonResponse({
    success: true,
    conversations,
    userType: isCompany ? 'company' : 'member',
  });
}

async function handleConversationGet(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const matchId = getQueryParams(req).get('matchId');
  if (!matchId) {
    return jsonResponse({ error: 'matchId is required' }, 400);
  }

  const { data: match, error: matchError } = await supabase
    .from('job_matches')
    .select(`
      id,
      profile_id,
      job_submissions!inner (id, company_id, title, companies!inner (id, user_id, company_name)),
      network_profiles!inner (id, user_id, full_name, profile_picture_url)
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return jsonResponse({ error: 'Match not found' }, 404);
  }

  const jobSubmission = match.job_submissions as any;
  const memberProfile = match.network_profiles as any;
  const isCompanyUser = user.id === jobSubmission.companies.user_id;
  const isMemberUser = user.id === memberProfile.user_id;

  if (!isCompanyUser && !isMemberUser) {
    return jsonResponse({ error: 'Not authorized' }, 403);
  }

  const userType = isCompanyUser ? 'company' : 'member';
  const senderId = isCompanyUser ? jobSubmission.companies.id : memberProfile.id;

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  // Mark messages as read
  const otherSenderType = userType === 'company' ? 'member' : 'company';
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .eq('sender_type', otherSenderType)
    .is('read_at', null);

  const formattedMessages = (messages || []).map(msg => ({
    id: msg.id,
    matchId: msg.match_id,
    senderType: msg.sender_type,
    senderId: msg.sender_id,
    content: msg.content,
    createdAt: msg.created_at,
    readAt: msg.read_at,
    isOwn: msg.sender_type === userType,
  }));

  return jsonResponse({
    success: true,
    messages: formattedMessages,
    match: {
      id: match.id,
      jobTitle: jobSubmission.title,
      participant: isCompanyUser ? {
        id: memberProfile.id,
        name: memberProfile.full_name,
        avatar: memberProfile.profile_picture_url,
        type: 'member',
      } : {
        id: jobSubmission.companies.id,
        name: jobSubmission.companies.company_name,
        avatar: null,
        type: 'company',
      },
    },
    userType,
  });
}

async function handleSendMessage(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { matchId, content } = body;

  if (!matchId || !content) {
    return jsonResponse({ error: 'matchId and content are required' }, 400);
  }

  const { data: match, error: matchError } = await supabase
    .from('job_matches')
    .select(`
      id,
      profile_id,
      job_id,
      job_submissions!inner (id, company_id, companies!inner (id, user_id)),
      network_profiles!inner (id, user_id)
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return jsonResponse({ error: 'Match not found' }, 404);
  }

  const jobSubmission = match.job_submissions as any;
  const memberProfile = match.network_profiles as any;

  let senderType: 'company' | 'member';
  let senderId: string;

  if (user.id === jobSubmission.companies.user_id) {
    senderType = 'company';
    senderId = jobSubmission.companies.id;
  } else if (user.id === memberProfile.user_id) {
    senderType = 'member';
    senderId = memberProfile.id;
  } else {
    return jsonResponse({ error: 'Not authorized' }, 403);
  }

  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_type: senderType,
      sender_id: senderId,
      content: content,
    })
    .select()
    .single();

  if (insertError || !message) {
    return jsonResponse({ error: 'Failed to send message' }, 500);
  }

  return jsonResponse({
    success: true,
    message: {
      id: message.id,
      matchId: message.match_id,
      senderType: message.sender_type,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
      readAt: message.read_at,
    },
  }, 201);
}

// ============================================================================
// DIRECT MESSAGES HANDLERS
// ============================================================================

async function handleDirectConversationsList(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id, full_name, profile_picture_url')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return jsonResponse({ success: true, conversations: [] });
  }

  const { data: conversations } = await supabase
    .from('direct_conversations')
    .select('*')
    .or(`participant_1_id.eq.${profile.id},participant_2_id.eq.${profile.id}`)
    .order('updated_at', { ascending: false });

  const result = [];
  for (const conv of conversations || []) {
    const otherId = conv.participant_1_id === profile.id ? conv.participant_2_id : conv.participant_1_id;
    
    const { data: otherProfile } = await supabase
      .from('network_profiles')
      .select('id, full_name, profile_picture_url')
      .eq('id', otherId)
      .single();

    const { data: lastMsg } = await supabase
      .from('direct_messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { count: unreadCount } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', profile.id)
      .is('read_at', null);

    result.push({
      id: conv.id,
      participant: otherProfile ? {
        id: otherProfile.id,
        name: otherProfile.full_name,
        avatar: otherProfile.profile_picture_url,
      } : null,
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        createdAt: lastMsg.created_at,
        isOwn: lastMsg.sender_id === profile.id,
      } : null,
      unreadCount: unreadCount || 0,
      updatedAt: conv.updated_at,
    });
  }

  return jsonResponse({ success: true, conversations: result });
}

async function handleDirectConversationGet(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const conversationId = getQueryParams(req).get('conversationId');
  if (!conversationId) {
    return jsonResponse({ error: 'conversationId is required' }, 400);
  }

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return jsonResponse({ error: 'Profile not found' }, 403);
  }

  const { data: conv } = await supabase
    .from('direct_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conv || (conv.participant_1_id !== profile.id && conv.participant_2_id !== profile.id)) {
    return jsonResponse({ error: 'Conversation not found or not authorized' }, 404);
  }

  const { data: messages } = await supabase
    .from('direct_messages')
    .select(`
      id, content, created_at, read_at, edited_at, sender_id,
      network_profiles!direct_messages_sender_id_fkey (id, full_name, profile_picture_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Mark as read
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', profile.id)
    .is('read_at', null);

  const formattedMessages = (messages || []).map(msg => {
    const sender = msg.network_profiles as any;
    return {
      id: msg.id,
      conversationId: conversationId,
      senderId: msg.sender_id,
      senderName: sender?.full_name,
      senderAvatar: sender?.profile_picture_url,
      content: msg.content,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      editedAt: msg.edited_at,
      isOwn: msg.sender_id === profile.id,
    };
  });

  return jsonResponse({ success: true, messages: formattedMessages });
}

async function handleDirectSend(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { conversationId, content } = body;

  if (!conversationId || !content) {
    return jsonResponse({ error: 'conversationId and content are required' }, 400);
  }

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id, full_name, profile_picture_url')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return jsonResponse({ error: 'Profile not found' }, 403);
  }

  const { data: conv } = await supabase
    .from('direct_conversations')
    .select('id, participant_1_id, participant_2_id')
    .eq('id', conversationId)
    .single();

  if (!conv || (conv.participant_1_id !== profile.id && conv.participant_2_id !== profile.id)) {
    return jsonResponse({ error: 'Not authorized' }, 403);
  }

  const { data: message, error: insertError } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: content,
    })
    .select('id, content, created_at, read_at, edited_at')
    .single();

  if (insertError || !message) {
    return jsonResponse({ error: 'Failed to send message' }, 500);
  }

  // Clear typing indicator
  await supabase
    .from('typing_indicators')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  return jsonResponse({
    success: true,
    message: {
      id: message.id,
      conversationId: conversationId,
      senderId: profile.id,
      senderName: profile.full_name,
      senderAvatar: profile.profile_picture_url,
      content: message.content,
      createdAt: message.created_at,
      readAt: message.read_at,
      editedAt: message.edited_at,
      isOwn: true,
    },
  }, 201);
}

async function handleDirectStart(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { participantId, initialMessage } = body;

  if (!participantId) {
    return jsonResponse({ error: 'participantId is required' }, 400);
  }

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return jsonResponse({ error: 'Profile not found' }, 403);
  }

  if (profile.id === participantId) {
    return jsonResponse({ error: 'Cannot start conversation with yourself' }, 400);
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('direct_conversations')
    .select('id')
    .or(`and(participant_1_id.eq.${profile.id},participant_2_id.eq.${participantId}),and(participant_1_id.eq.${participantId},participant_2_id.eq.${profile.id})`)
    .single();

  if (existing) {
    return jsonResponse({
      success: true,
      conversation: { id: existing.id },
      isExisting: true,
    });
  }

  // Create new conversation
  const { data: conv, error: convError } = await supabase
    .from('direct_conversations')
    .insert({
      participant_1_id: profile.id,
      participant_2_id: participantId,
    })
    .select('id')
    .single();

  if (convError || !conv) {
    return jsonResponse({ error: 'Failed to create conversation' }, 500);
  }

  // Send initial message if provided
  if (initialMessage) {
    await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conv.id,
        sender_id: profile.id,
        content: initialMessage,
      });
  }

  return jsonResponse({
    success: true,
    conversation: { id: conv.id },
    isExisting: false,
  }, 201);
}

// ============================================================================
// UNREAD COUNT HANDLER
// ============================================================================

async function handleUnreadCount(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (company) {
    const { data: matches } = await supabase
      .from('job_matches')
      .select(`id, job_submissions!inner (company_id)`)
      .eq('job_submissions.company_id', company.id);

    const matchIds = (matches || []).map(m => m.id);
    if (matchIds.length === 0) return jsonResponse({ count: 0 });

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .eq('sender_type', 'member')
      .is('read_at', null);

    return jsonResponse({ count: count || 0 });
  }

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profile) {
    const { data: matches } = await supabase
      .from('job_matches')
      .select('id')
      .eq('profile_id', profile.id);

    const matchIds = (matches || []).map(m => m.id);
    if (matchIds.length === 0) return jsonResponse({ count: 0 });

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .eq('sender_type', 'company')
      .is('read_at', null);

    return jsonResponse({ count: count || 0 });
  }

  return jsonResponse({ count: 0 });
}

// ============================================================================
// NOTIFY HANDLER
// ============================================================================

async function handleNotify(
  req: Request,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Verify service key
  const serviceKey = req.headers.get('X-Service-Key');
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey !== expectedKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const { recipientUserId, recipientEmail, senderName, messagePreview, conversationType, conversationId, jobTitle } = body;

  if (!recipientUserId && !recipientEmail) {
    return jsonResponse({ error: 'recipientUserId or recipientEmail required' }, 400);
  }

  let email = recipientEmail;
  if (!email && recipientUserId) {
    const { data: userData } = await supabase.auth.admin.getUserById(recipientUserId);
    email = userData?.user?.email;
  }

  if (!email) {
    return jsonResponse({ success: false, reason: 'No email found' });
  }

  // Get recipient name
  let recipientName: string | undefined;
  if (recipientUserId) {
    const { data: profile } = await supabase
      .from('network_profiles')
      .select('full_name')
      .eq('user_id', recipientUserId)
      .single();
    recipientName = profile?.full_name;
  }

  const baseUrl = process.env.PUBLIC_URL || `https://${EMAIL_FROM_DOMAIN}`;
  const messagesUrl = conversationType === 'direct' 
    ? `${baseUrl}/network/messages?conversation=${conversationId}`
    : `${baseUrl}/messages?match=${conversationId}`;

  const htmlContent = messageNotificationEmail({
    recipientName,
    senderName: senderName || 'Someone',
    messagePreview: messagePreview || 'You have a new message',
    messagesUrl,
    jobTitle,
  });

  const emailSent = await sendEmail(email, `New message from ${senderName || 'Someone'}`, htmlContent);

  return jsonResponse({
    success: true,
    emailSent,
    recipient: email,
  });
}

// ============================================================================
// PRESENCE & TYPING HANDLERS
// ============================================================================

async function handlePresence(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const { status } = body;

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        status: status || 'online',
        last_seen: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      return jsonResponse({ error: 'Failed to update presence' }, 500);
    }

    return jsonResponse({ success: true });
  }

  if (req.method === 'GET') {
    const userId = getQueryParams(req).get('userId');
    if (!userId) {
      return jsonResponse({ error: 'userId required' }, 400);
    }

    const { data } = await supabase
      .from('user_presence')
      .select('status, last_seen')
      .eq('user_id', userId)
      .single();

    return jsonResponse({
      status: data?.status || 'offline',
      lastSeen: data?.last_seen,
    });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handleTyping(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { conversationId, isTyping } = body;

  if (!conversationId) {
    return jsonResponse({ error: 'conversationId required' }, 400);
  }

  if (isTyping) {
    await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id,user_id' });
  } else {
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }

  return jsonResponse({ success: true });
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Supabase not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const pathSegments = getPathSegments(req);
  const route = pathSegments.join('/');

  console.log(`[MESSAGES] Route: ${route}, Method: ${req.method}`);

  // Notify doesn't require user auth (uses service key)
  if (route === 'notify') {
    return handleNotify(req, supabase);
  }

  // All other routes require authentication
  const { user, error: authError } = await authenticateUser(req, supabase);
  if (authError) {
    return jsonResponse({ error: authError }, 401);
  }

  try {
    switch (route) {
      // Job Match Conversations
      case 'conversations':
        return handleConversationsList(req, supabase, user);
      case 'conversation':
        return handleConversationGet(req, supabase, user);
      case 'send':
        return handleSendMessage(req, supabase, user);

      // Direct Messages
      case 'direct/conversations':
        return handleDirectConversationsList(req, supabase, user);
      case 'direct/conversation':
        return handleDirectConversationGet(req, supabase, user);
      case 'direct/send':
        return handleDirectSend(req, supabase, user);
      case 'direct/start':
        return handleDirectStart(req, supabase, user);

      // Utilities
      case 'unread-count':
        return handleUnreadCount(req, supabase, user);
      case 'presence':
        return handlePresence(req, supabase, user);
      case 'typing':
        return handleTyping(req, supabase, user);

      default:
        console.warn(`[MESSAGES] Unknown route: ${route}`);
        return jsonResponse({ error: `Route not found: /api/messages/${route}` }, 404);
    }
  } catch (error) {
    console.error('[MESSAGES] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
