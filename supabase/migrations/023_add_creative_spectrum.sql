-- Add creative tech spectrum field to network_profiles
-- 0 = design-focused, 50 = hybrid creative (default), 100 = dev-focused
-- Both ends are creative technologists — this indicates lean, not identity
ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS creative_spectrum INTEGER DEFAULT 50
  CHECK (creative_spectrum >= 0 AND creative_spectrum <= 100);

-- Add comment for documentation
COMMENT ON COLUMN network_profiles.creative_spectrum IS 'Creative tech spectrum: 0=design-focused, 50=hybrid, 100=dev-focused (all within creative technology)';
