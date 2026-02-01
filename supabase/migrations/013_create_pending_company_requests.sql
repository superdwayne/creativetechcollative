-- Create pending_company_requests table for company access requests
-- Requests are stored here until admin approves/rejects them
-- Upon approval, a Supabase Auth user and companies record are created

CREATE TABLE IF NOT EXISTS pending_company_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

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

  -- Request Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin review fields
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pending_company_requests_status ON pending_company_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_company_requests_email ON pending_company_requests(contact_email);
CREATE INDEX IF NOT EXISTS idx_pending_company_requests_created_at ON pending_company_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pending_company_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts (unauthenticated users can submit requests)
-- This is intentional - we want anyone to be able to request access
DO $$ BEGIN
  CREATE POLICY "Anyone can create access requests"
    ON pending_company_requests FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Only admins can view requests (via service role)
-- Regular users cannot see pending requests
-- Admin access is handled via service role key

-- Policy: Requesters can view their own request by email (for status check page if needed)
DO $$ BEGIN
  CREATE POLICY "Requesters can view own request by email"
    ON pending_company_requests FOR SELECT
    USING (false); -- Disabled for now - admin only via service role
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_pending_company_requests_updated_at ON pending_company_requests;
CREATE TRIGGER update_pending_company_requests_updated_at
  BEFORE UPDATE ON pending_company_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE pending_company_requests IS 'Pending company access requests awaiting admin approval';
COMMENT ON COLUMN pending_company_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN pending_company_requests.reviewed_by IS 'Admin user who reviewed the request';
COMMENT ON COLUMN pending_company_requests.admin_notes IS 'Internal notes from admin review';
