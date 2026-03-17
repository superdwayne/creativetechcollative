-- Migration: Enable Supabase Realtime for messaging tables
-- Description: Add messages, direct_messages, and typing_indicators to the
--   supabase_realtime publication so that postgres_changes subscriptions fire
--   when rows are inserted / updated / deleted.

-- Remove tables first (idempotent – catch error if not present)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE messages;
EXCEPTION WHEN undefined_object THEN NULL;
          WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE direct_messages;
EXCEPTION WHEN undefined_object THEN NULL;
          WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE typing_indicators;
EXCEPTION WHEN undefined_object THEN NULL;
          WHEN OTHERS THEN NULL;
END $$;

-- Add them back
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
