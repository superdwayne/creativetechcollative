-- Migration: Create job_submissions table
-- Description: Store job specifications submitted by companies for matching

-- Create job_submissions table
CREATE TABLE IF NOT EXISTS job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  preferred_skills TEXT[],
  focus_areas TEXT[],
  budget_range VARCHAR(100),
  project_type VARCHAR(50) NOT NULL,
  remote_preference VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  timeline VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints for enum-like fields
  CONSTRAINT valid_project_type CHECK (project_type IN ('freelance', 'contract', 'full-time', 'project-based')),
  CONSTRAINT valid_remote_preference CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'flexible')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'matched', 'closed', 'rejected'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_submissions_company_id ON job_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_job_submissions_status ON job_submissions(status);
CREATE INDEX IF NOT EXISTS idx_job_submissions_created_at ON job_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE job_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies can view their own job submissions
DO $$ BEGIN
  CREATE POLICY "companies_view_own_jobs"
    ON job_submissions FOR SELECT TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can create job submissions for their company
DO $$ BEGIN
  CREATE POLICY "companies_create_own_jobs"
    ON job_submissions FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can update their own job submissions (limited fields - handled in app logic)
DO $$ BEGIN
  CREATE POLICY "companies_update_own_jobs"
    ON job_submissions FOR UPDATE TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Note: Admin access is handled via service role key (bypasses RLS)
-- Admins will use the service role to see all submissions

-- Add trigger to automatically update updated_at column
-- Reuses the update_updated_at_column() function from 001_create_network_profiles.sql
DROP TRIGGER IF EXISTS update_job_submissions_updated_at ON job_submissions;
CREATE TRIGGER update_job_submissions_updated_at
  BEFORE UPDATE ON job_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
