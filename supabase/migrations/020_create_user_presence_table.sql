-- Migration: Create user_presence table for real-time presence tracking
-- Description: Tracks user online status and last_seen timestamp for email notification decisions.
-- The API's notification system checks this table to skip emails for users who are actively online.

-- ================================================
-- 1. Create user_presence Table
-- ================================================
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_status CHECK (status IN ('online', 'offline', 'away'))
);

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- ================================================
-- 2. Enable Row Level Security
-- ================================================
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API)
-- Authenticated users can read presence of others
DO $$ BEGIN
  CREATE POLICY "users_view_presence"
    ON user_presence FOR SELECT TO authenticated
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own presence
DO $$ BEGIN
  CREATE POLICY "users_update_own_presence"
    ON user_presence FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "users_upsert_own_presence"
    ON user_presence FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- 3. Comments
-- ================================================
COMMENT ON TABLE user_presence IS 'Tracks user online/offline status for email notification decisions';
COMMENT ON COLUMN user_presence.status IS 'Current status: online, offline, or away';
COMMENT ON COLUMN user_presence.last_seen IS 'Timestamp of last activity heartbeat';
