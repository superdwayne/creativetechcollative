-- Create companies table for registered company accounts
-- Companies can submit job specifications to match with network members

CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to Supabase Auth user (one company per user)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  company_website TEXT,

  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),

  -- Company Details
  company_size VARCHAR(50) CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  industry VARCHAR(255),

  -- Admin verification status
  verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(verified);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can read their own record
DO $$ BEGIN
  CREATE POLICY "Companies can view their own record"
    ON companies FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Authenticated users can create their own company
DO $$ BEGIN
  CREATE POLICY "Users can create their own company"
    ON companies FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Companies can update their own record
DO $$ BEGIN
  CREATE POLICY "Companies can update their own record"
    ON companies FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Admins can view all companies (using service role or checking admin status)
-- Note: Admin access is typically handled via service role key or a separate admin check
-- For now, we rely on service role for admin operations

-- Trigger to auto-update updated_at (reuse existing function from 001 migration)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Registered company accounts that can submit job specifications';
COMMENT ON COLUMN companies.user_id IS 'Link to Supabase Auth user account';
COMMENT ON COLUMN companies.company_size IS 'Company size: startup, small, medium, large, or enterprise';
COMMENT ON COLUMN companies.verified IS 'Whether the company has been verified by an admin';
