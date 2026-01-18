-- Migration: Create analysis credits tables
-- Description: Tables for tracking company AI analysis credits and usage

-- Create company_analysis_credits table
-- Tracks the credit balance for each company
CREATE TABLE IF NOT EXISTS company_analysis_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  free_analyses_remaining INTEGER NOT NULL DEFAULT 5,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT non_negative_free_analyses CHECK (free_analyses_remaining >= 0),
  CONSTRAINT non_negative_purchased_credits CHECK (purchased_credits >= 0)
);

-- Create analysis_usage_logs table
-- Tracks each analysis performed with credit type used
CREATE TABLE IF NOT EXISTS analysis_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_title VARCHAR(500) NOT NULL,
  credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('free', 'purchased')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create credit_purchases table
-- Tracks all credit purchases and admin grants
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  credits_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_credits_amount CHECK (credits_amount > 0),
  CONSTRAINT non_negative_price CHECK (price_cents >= 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_company_analysis_credits_company_id ON company_analysis_credits(company_id);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_logs_company_id ON analysis_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_logs_created_at ON analysis_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_company_id ON credit_purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE company_analysis_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_analysis_credits

-- Companies can view their own credit balance
DO $$ BEGIN
  CREATE POLICY "companies_view_own_credits"
    ON company_analysis_credits FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for analysis_usage_logs

-- Companies can view their own usage logs
DO $$ BEGIN
  CREATE POLICY "companies_view_own_usage_logs"
    ON analysis_usage_logs FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for credit_purchases

-- Companies can view their own purchase history
DO $$ BEGIN
  CREATE POLICY "companies_view_own_purchases"
    ON credit_purchases FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Note: Insert, Update, Delete operations use service role key (bypasses RLS)
-- This is intentional as credit modifications should only happen through API endpoints

-- Trigger to auto-update updated_at on company_analysis_credits
DROP TRIGGER IF EXISTS update_company_analysis_credits_updated_at ON company_analysis_credits;
CREATE TRIGGER update_company_analysis_credits_updated_at
  BEFORE UPDATE ON company_analysis_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE company_analysis_credits IS 'Tracks analysis credit balances for each company';
COMMENT ON COLUMN company_analysis_credits.company_id IS 'Reference to the company that owns these credits';
COMMENT ON COLUMN company_analysis_credits.free_analyses_remaining IS 'Number of free analysis credits remaining (starts at 5)';
COMMENT ON COLUMN company_analysis_credits.purchased_credits IS 'Number of purchased analysis credits remaining';

COMMENT ON TABLE analysis_usage_logs IS 'Log of each analysis performed, tracking credit type used';
COMMENT ON COLUMN analysis_usage_logs.job_title IS 'Title of the job that was analyzed';
COMMENT ON COLUMN analysis_usage_logs.credit_type IS 'Type of credit used: free or purchased';

COMMENT ON TABLE credit_purchases IS 'Record of credit purchases and admin grants';
COMMENT ON COLUMN credit_purchases.credits_amount IS 'Number of credits purchased';
COMMENT ON COLUMN credit_purchases.price_cents IS 'Price paid in cents (0 for admin grants)';
COMMENT ON COLUMN credit_purchases.stripe_payment_id IS 'Stripe payment ID or ADMIN_GRANT for manual grants';
