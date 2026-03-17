-- Migration: Create company message credits tables
-- Description: Track message allowances for companies on the platform.
--   Each company gets a starter pack of free messages on signup.
--   Admins can top up credits at any time.

-- Credit balance per company
CREATE TABLE IF NOT EXISTS company_message_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  free_messages_remaining INTEGER NOT NULL DEFAULT 25,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT non_negative_free_messages CHECK (free_messages_remaining >= 0),
  CONSTRAINT non_negative_purchased_message_credits CHECK (purchased_credits >= 0)
);

-- Log every message that consumed a credit
CREATE TABLE IF NOT EXISTS message_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  message_id UUID,
  match_id UUID,
  credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('free', 'purchased')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Admin grants / future purchases
CREATE TABLE IF NOT EXISTS message_credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  credits_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT positive_message_credits CHECK (credits_amount > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_message_credits_company ON company_message_credits(company_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_logs_company ON message_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_logs_created ON message_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_credit_purchases_company ON message_credit_purchases(company_id);

-- RLS
ALTER TABLE company_message_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Companies can view their own message credit balance
DO $$ BEGIN
  CREATE POLICY "companies_view_own_message_credits"
    ON company_message_credits FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can view their own message usage logs
DO $$ BEGIN
  CREATE POLICY "companies_view_own_message_usage"
    ON message_usage_logs FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Companies can view their own message credit purchases
DO $$ BEGIN
  CREATE POLICY "companies_view_own_message_purchases"
    ON message_credit_purchases FOR SELECT TO authenticated
    USING (
      company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_company_message_credits_updated_at ON company_message_credits;
CREATE TRIGGER update_company_message_credits_updated_at
  BEFORE UPDATE ON company_message_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documentation
COMMENT ON TABLE company_message_credits IS 'Message credit balances for each company';
COMMENT ON COLUMN company_message_credits.free_messages_remaining IS 'Free message credits remaining (starts at 25)';
COMMENT ON COLUMN company_message_credits.purchased_credits IS 'Purchased/granted message credits remaining';
COMMENT ON TABLE message_usage_logs IS 'Log of each message sent that consumed a credit';
COMMENT ON TABLE message_credit_purchases IS 'Record of message credit grants and purchases';
