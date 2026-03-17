-- Contact Requests: companies request to be connected with directory members.
-- Admin reviews, reaches out to the member, then connects the two parties.

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES network_profiles(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, profile_id)
);

CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_company ON contact_requests(company_id);
CREATE INDEX idx_contact_requests_profile ON contact_requests(profile_id);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Companies can insert requests for their own company
CREATE POLICY "Companies can create contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

-- Companies can view their own requests
CREATE POLICY "Companies can view own contact requests"
  ON contact_requests FOR SELECT
  USING (auth.uid() = requested_by);
