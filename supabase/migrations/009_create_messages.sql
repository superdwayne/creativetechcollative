-- Migration: Create messages table
-- Description: Store messages between companies and members for job matches

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES job_matches(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  -- Constraints
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('company', 'member'))
);

-- Create index on match_id for fast conversation loading
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);

-- Create index on sender_id for filtering by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies can view messages for matches on their jobs
DO $$ BEGIN
  CREATE POLICY "companies_view_match_messages"
    ON messages FOR SELECT TO authenticated
    USING (
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN job_submissions js ON jm.job_id = js.id
        JOIN companies c ON js.company_id = c.id
        WHERE c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can insert messages for matches on their jobs
DO $$ BEGIN
  CREATE POLICY "companies_insert_match_messages"
    ON messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_type = 'company' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN job_submissions js ON jm.job_id = js.id
        JOIN companies c ON js.company_id = c.id
        WHERE c.user_id = auth.uid() AND c.id = sender_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can update read_at on messages sent to them
DO $$ BEGIN
  CREATE POLICY "companies_update_read_at"
    ON messages FOR UPDATE TO authenticated
    USING (
      sender_type = 'member' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN job_submissions js ON jm.job_id = js.id
        JOIN companies c ON js.company_id = c.id
        WHERE c.user_id = auth.uid()
      )
    )
    WITH CHECK (
      sender_type = 'member' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN job_submissions js ON jm.job_id = js.id
        JOIN companies c ON js.company_id = c.id
        WHERE c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members can view messages for their matches
DO $$ BEGIN
  CREATE POLICY "members_view_match_messages"
    ON messages FOR SELECT TO authenticated
    USING (
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN network_profiles np ON jm.profile_id = np.id
        WHERE np.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members can insert messages for their matches
DO $$ BEGIN
  CREATE POLICY "members_insert_match_messages"
    ON messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_type = 'member' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN network_profiles np ON jm.profile_id = np.id
        WHERE np.user_id = auth.uid() AND np.id = sender_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members can update read_at on messages sent to them
DO $$ BEGIN
  CREATE POLICY "members_update_read_at"
    ON messages FOR UPDATE TO authenticated
    USING (
      sender_type = 'company' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN network_profiles np ON jm.profile_id = np.id
        WHERE np.user_id = auth.uid()
      )
    )
    WITH CHECK (
      sender_type = 'company' AND
      match_id IN (
        SELECT jm.id FROM job_matches jm
        JOIN network_profiles np ON jm.profile_id = np.id
        WHERE np.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comments for documentation
COMMENT ON TABLE messages IS 'Messages between companies and members for job matches';
COMMENT ON COLUMN messages.match_id IS 'Reference to the job match this conversation belongs to';
COMMENT ON COLUMN messages.sender_type IS 'Type of sender: company or member';
COMMENT ON COLUMN messages.sender_id IS 'UUID of the sender - company.id or network_profiles.id depending on sender_type';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.created_at IS 'Timestamp when message was sent';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read by recipient, null if unread';
