-- Migration: Create message reactions table
-- Description: Enable emoji reactions on both job match messages and direct messages

-- ================================================
-- 1. Message Reactions Table
-- ================================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'job_match' or 'direct'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(32) NOT NULL, -- emoji character(s), e.g. '👍', '❤️', '🔥'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Each user can only react with the same emoji once per message
  CONSTRAINT unique_reaction_per_user UNIQUE (message_id, message_type, user_id, emoji),
  CONSTRAINT valid_message_type CHECK (message_type IN ('job_match', 'direct'))
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id, message_type);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- ================================================
-- 2. Enable Row Level Security
-- ================================================
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 3. RLS Policies
-- ================================================

-- Anyone authenticated can view reactions on messages they have access to
-- (The API layer enforces conversation-level access; RLS allows broad read for real-time)
DO $$ BEGIN
  CREATE POLICY "users_view_reactions"
    ON message_reactions FOR SELECT TO authenticated
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can add their own reactions
DO $$ BEGIN
  CREATE POLICY "users_add_reactions"
    ON message_reactions FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can remove their own reactions
DO $$ BEGIN
  CREATE POLICY "users_remove_reactions"
    ON message_reactions FOR DELETE TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- 4. Enable Realtime for reactions
-- ================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- 5. Comments
-- ================================================
COMMENT ON TABLE message_reactions IS 'Emoji reactions on job match and direct messages';
COMMENT ON COLUMN message_reactions.message_id IS 'ID of the message being reacted to (from messages or direct_messages table)';
COMMENT ON COLUMN message_reactions.message_type IS 'Type of message: job_match (messages table) or direct (direct_messages table)';
COMMENT ON COLUMN message_reactions.emoji IS 'The emoji character(s) used for the reaction';
