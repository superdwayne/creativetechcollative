-- Add account creation token fields to beta_applications
-- Used for secure account creation after approval

-- Add token column for secure account creation link
ALTER TABLE beta_applications 
ADD COLUMN IF NOT EXISTS account_creation_token TEXT UNIQUE;

-- Add token expiration (7 days from approval)
ALTER TABLE beta_applications 
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add password_set flag to track if user has created their account
ALTER TABLE beta_applications 
ADD COLUMN IF NOT EXISTS account_created BOOLEAN DEFAULT FALSE;

-- Add account_created_at timestamp
ALTER TABLE beta_applications 
ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_beta_applications_token ON beta_applications(account_creation_token);

-- Add comments
COMMENT ON COLUMN beta_applications.account_creation_token IS 'Secure token sent in approval email for account creation. Expires after 7 days.';
COMMENT ON COLUMN beta_applications.token_expires_at IS 'Expiration timestamp for the account creation token.';
COMMENT ON COLUMN beta_applications.account_created IS 'Whether the user has created their account with password.';
COMMENT ON COLUMN beta_applications.account_created_at IS 'When the user created their account.';
