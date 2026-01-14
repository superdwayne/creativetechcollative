-- Migration: Create job_matches table
-- Description: Store AI-generated matches between job submissions and member profiles

-- Create job_matches table
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_submissions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES network_profiles(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL,
  match_reasoning TEXT NOT NULL,
  skill_matches JSONB,
  vector_similarity FLOAT,
  admin_approved BOOLEAN DEFAULT NULL,
  member_notified BOOLEAN DEFAULT false NOT NULL,
  member_response VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_match_score CHECK (match_score >= 0 AND match_score <= 100),
  CONSTRAINT valid_member_response CHECK (
    member_response IS NULL OR 
    member_response IN ('interested', 'not-interested', 'no-response')
  ),
  -- Unique constraint: one match per job-profile pair
  CONSTRAINT unique_job_profile_match UNIQUE (job_id, profile_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_profile_id ON job_matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_match_score ON job_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_matches_admin_approved ON job_matches(admin_approved);

-- Enable Row Level Security
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins have full access via service role (bypasses RLS)
-- Companies can view approved matches for their own jobs
CREATE POLICY "companies_view_approved_matches"
  ON job_matches
  FOR SELECT
  TO authenticated
  USING (
    admin_approved = true AND
    job_id IN (
      SELECT js.id FROM job_submissions js
      JOIN companies c ON js.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Members can view matches where they are the profile
CREATE POLICY "members_view_own_matches"
  ON job_matches
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM network_profiles WHERE user_id = auth.uid()
    )
  );

-- Members can update their response on their own matches
CREATE POLICY "members_update_own_response"
  ON job_matches
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM network_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM network_profiles WHERE user_id = auth.uid()
    )
  );

-- Note: Insert and admin operations use service role key (bypasses RLS)

-- Comments for documentation
COMMENT ON TABLE job_matches IS 'AI-generated matches between job submissions and network member profiles';
COMMENT ON COLUMN job_matches.match_score IS 'AI-calculated relevance score from 0-100';
COMMENT ON COLUMN job_matches.match_reasoning IS 'AI-generated explanation of why this candidate matches';
COMMENT ON COLUMN job_matches.skill_matches IS 'JSON object containing specific skills that matched';
COMMENT ON COLUMN job_matches.vector_similarity IS 'Raw cosine similarity score from vector search';
COMMENT ON COLUMN job_matches.admin_approved IS 'null=pending review, true=approved, false=rejected';
COMMENT ON COLUMN job_matches.member_notified IS 'Whether the member has been notified of this match';
COMMENT ON COLUMN job_matches.member_response IS 'Member response: interested, not-interested, or no-response';
