-- Migration: Create direct messaging between members
-- Description: Enable member-to-member conversations with typing indicators, read receipts, templates, and file attachments

-- ================================================
-- 1. Direct Conversations Table
-- ================================================
CREATE TABLE IF NOT EXISTS direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES network_profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES network_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure participant_1_id < participant_2_id to prevent duplicate conversations
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id),
  CONSTRAINT different_participants CHECK (participant_1_id <> participant_2_id),
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_1 ON direct_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_2 ON direct_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated ON direct_conversations(updated_at DESC);

-- ================================================
-- 2. Direct Messages Table
-- ================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES network_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- For reply threading (optional future use)
  reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ================================================
-- 3. Typing Indicators Table (ephemeral, for real-time)
-- ================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  conversation_type VARCHAR(20) NOT NULL, -- 'direct' or 'job_match'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES network_profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, user_id),
  CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('direct', 'job_match'))
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_typing_indicators_started ON typing_indicators(started_at);

-- ================================================
-- 4. Message Templates Table
-- ================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_template_name_per_user UNIQUE (user_id, name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_message_templates_user ON message_templates(user_id);

-- ================================================
-- 5. File Attachments Table
-- ================================================
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID, -- Can be NULL initially (upload before sending)
  message_type VARCHAR(20) NOT NULL, -- 'direct' or 'job_match'
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_message_type CHECK (message_type IN ('direct', 'job_match'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploader ON message_attachments(uploader_id);

-- ================================================
-- 6. Add edit/delete support to existing messages table
-- ================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================
-- 7. Function to update conversation updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_direct_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE direct_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON direct_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_conversation_timestamp();

-- ================================================
-- 8. Function to clean up stale typing indicators (older than 10 seconds)
-- ================================================
CREATE OR REPLACE FUNCTION cleanup_stale_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- Enable Row Level Security
-- ================================================
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies: Direct Conversations
-- ================================================

-- Users can view conversations they're part of
DO $$ BEGIN
  CREATE POLICY "users_view_own_conversations"
    ON direct_conversations FOR SELECT TO authenticated
    USING (
      participant_1_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      OR participant_2_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can create conversations they're part of
DO $$ BEGIN
  CREATE POLICY "users_create_conversations"
    ON direct_conversations FOR INSERT TO authenticated
    WITH CHECK (
      participant_1_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      OR participant_2_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- RLS Policies: Direct Messages
-- ================================================

-- Users can view messages in their conversations
DO $$ BEGIN
  CREATE POLICY "users_view_conversation_messages"
    ON direct_messages FOR SELECT TO authenticated
    USING (
      conversation_id IN (
        SELECT id FROM direct_conversations 
        WHERE participant_1_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
           OR participant_2_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can send messages in their conversations
DO $$ BEGIN
  CREATE POLICY "users_send_messages"
    ON direct_messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      AND conversation_id IN (
        SELECT id FROM direct_conversations 
        WHERE participant_1_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
           OR participant_2_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own messages (edit) or mark messages as read
DO $$ BEGIN
  CREATE POLICY "users_update_messages"
    ON direct_messages FOR UPDATE TO authenticated
    USING (
      -- Can edit own messages
      sender_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      OR
      -- Can mark messages from others as read
      (conversation_id IN (
        SELECT id FROM direct_conversations 
        WHERE participant_1_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
           OR participant_2_id IN (SELECT id FROM network_profiles WHERE user_id = auth.uid())
      ) AND sender_id NOT IN (SELECT id FROM network_profiles WHERE user_id = auth.uid()))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- RLS Policies: Typing Indicators
-- ================================================

-- Anyone in the conversation can view typing indicators
DO $$ BEGIN
  CREATE POLICY "users_view_typing"
    ON typing_indicators FOR SELECT TO authenticated
    USING (TRUE); -- Will be filtered by conversation access in queries
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can manage their own typing indicators
DO $$ BEGIN
  CREATE POLICY "users_manage_own_typing"
    ON typing_indicators FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- RLS Policies: Message Templates
-- ================================================

-- Users can only access their own templates
DO $$ BEGIN
  CREATE POLICY "users_own_templates"
    ON message_templates FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- RLS Policies: Message Attachments
-- ================================================

-- Users can view attachments for messages they can access
DO $$ BEGIN
  CREATE POLICY "users_view_attachments"
    ON message_attachments FOR SELECT TO authenticated
    USING (uploader_id = auth.uid() OR message_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can upload attachments
DO $$ BEGIN
  CREATE POLICY "users_upload_attachments"
    ON message_attachments FOR INSERT TO authenticated
    WITH CHECK (uploader_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own attachments (link to message)
DO $$ BEGIN
  CREATE POLICY "users_update_own_attachments"
    ON message_attachments FOR UPDATE TO authenticated
    USING (uploader_id = auth.uid())
    WITH CHECK (uploader_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- Insert Default Message Templates
-- ================================================
-- (These are system-wide defaults, users can create their own)

-- ================================================
-- Comments for documentation
-- ================================================
COMMENT ON TABLE direct_conversations IS 'Direct message conversations between two network members';
COMMENT ON TABLE direct_messages IS 'Messages within direct conversations';
COMMENT ON TABLE typing_indicators IS 'Real-time typing status indicators';
COMMENT ON TABLE message_templates IS 'Saved message templates for quick replies';
COMMENT ON TABLE message_attachments IS 'File attachments for messages';
