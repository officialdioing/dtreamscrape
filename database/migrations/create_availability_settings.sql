-- Create availability_settings table for custom availability management
CREATE TABLE IF NOT EXISTS availability_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage availability settings"
ON availability_settings
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Insert default availability settings
INSERT INTO availability_settings (id, settings)
VALUES (
  'default',
  '{
    "weekly": {
      "sunday": {"enabled": false, "slots": []},
      "monday": {"enabled": true, "slots": [{"start": "08:00", "end": "17:00"}]},
      "tuesday": {"enabled": true, "slots": [{"start": "08:00", "end": "17:00"}]},
      "wednesday": {"enabled": true, "slots": [{"start": "08:00", "end": "17:00"}]},
      "thursday": {"enabled": true, "slots": [{"start": "08:00", "end": "17:00"}]},
      "friday": {"enabled": true, "slots": [{"start": "08:00", "end": "17:00"}]},
      "saturday": {"enabled": false, "slots": []}
    },
    "overrides": [],
    "bufferTime": 0,
    "minBookingNotice": 24,
    "maxBookingAdvance": 90
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_availability_settings_updated_at ON availability_settings(updated_at);

-- Add comments for documentation
COMMENT ON TABLE availability_settings IS 'Stores custom availability settings for the booking system';
COMMENT ON COLUMN availability_settings.id IS 'Settings ID (default for single instance)';
COMMENT ON COLUMN availability_settings.settings IS 'JSONB containing weekly availability, overrides, and booking rules';