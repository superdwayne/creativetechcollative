-- Simplify pending_company_requests to only require company_name and contact_email
-- Other fields are now optional for a simpler request access flow

-- Make contact_name nullable
ALTER TABLE pending_company_requests 
  ALTER COLUMN contact_name DROP NOT NULL;

-- Add comment explaining the simplified flow
COMMENT ON TABLE pending_company_requests IS 'Pending company access requests - simplified to just company name and email';
