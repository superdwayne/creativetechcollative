-- Beta Feedback table for collecting user feedback during beta testing
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  page_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying feedback by user
CREATE INDEX idx_beta_feedback_user ON beta_feedback(user_id);
CREATE INDEX idx_beta_feedback_created ON beta_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can submit feedback"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON beta_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admins (service role) can read all feedback via API
