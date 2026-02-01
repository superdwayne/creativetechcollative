-- Create beta_applications table for tracking beta program signups
CREATE TABLE IF NOT EXISTS beta_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  interests TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_email ON beta_applications(email);

-- Enable RLS
ALTER TABLE beta_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Service role bypasses RLS, so admin operations work
-- Policy: Anyone can insert (submit application)
CREATE POLICY "Anyone can submit beta application" ON beta_applications
  FOR INSERT WITH CHECK (true);

-- Policy: No direct select for regular users (admin uses service role)
CREATE POLICY "No direct select" ON beta_applications
  FOR SELECT USING (false);

-- Policy: No direct update for regular users (admin uses service role)  
CREATE POLICY "No direct update" ON beta_applications
  FOR UPDATE USING (false);
