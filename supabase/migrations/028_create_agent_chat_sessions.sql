-- Agent Chat Sessions: persist CT Finder (talent agent) conversations
-- so admins can see them in the company conversation history.

CREATE TABLE IF NOT EXISTS agent_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, session_id)
);

CREATE INDEX idx_agent_chat_sessions_company ON agent_chat_sessions(company_id);

ALTER TABLE agent_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own agent chat sessions
CREATE POLICY "Companies can insert own agent chats"
  ON agent_chat_sessions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view own agent chats"
  ON agent_chat_sessions FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own agent chats"
  ON agent_chat_sessions FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can delete own agent chats"
  ON agent_chat_sessions FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- Reuse existing trigger function from migration 001
CREATE TRIGGER update_agent_chat_sessions_updated_at
  BEFORE UPDATE ON agent_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
