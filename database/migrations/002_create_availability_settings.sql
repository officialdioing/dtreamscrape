-- Create availability_settings table for custom availability management
CREATE TABLE IF NOT EXISTS availability_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default unrestricted availability settings
INSERT INTO availability_settings (id, settings)
VALUES (
  'default',
  jsonb_build_object(
    'weekly', jsonb_build_object(
      'sunday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'monday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'tuesday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'wednesday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'thursday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'friday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb),
      'saturday', jsonb_build_object('enabled', 'true', 'slots', '[]'::jsonb)
    ),
    'overrides', '[]'::jsonb,
    'bufferTime', 0,
    'minBookingNotice', 0,
    'maxBookingAdvance', 365
  )
)
ON CONFLICT (id) DO NOTHING;

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_availability_settings_updated_at ON availability_settings(updated_at);

-- Add comments for documentation
COMMENT ON TABLE availability_settings IS 'Stores custom availability settings for the booking system - completely unrestricted by default';
COMMENT ON COLUMN availability_settings.id IS 'Settings ID (default for single instance)';
COMMENT ON COLUMN availability_settings.settings IS 'JSONB containing weekly availability, overrides, and booking rules';