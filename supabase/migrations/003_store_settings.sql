-- Create store_settings table for managing store configuration
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_store_settings_key ON store_settings(key);

-- Insert default store settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'Little Luxuries'),
  ('business_email', 'concierge@littleluxuries.com'),
  ('contact_phone', '+1 (555) 892-0192'),
  ('timezone', 'Europe/London'),
  ('timezone_display', 'London (GMT +00)'),
  ('logo_url', '/src/assets/logo.png'),
  ('currency', 'PKR'),
  ('currency_symbol', '₨'),
  ('address_line1', '14 Coral Lane'),
  ('address_city', 'London'),
  ('address_country', 'United Kingdom'),
  ('business_hours', 'Mon–Fri · 9am – 5pm GMT'),
  ('business_hours_start', '09:00'),
  ('business_hours_end', '17:00'),
  ('social_instagram', '@littleluxuries'),
  ('social_facebook', 'littleluxuries'),
  ('meta_title_suffix', 'Little Luxuries'),
  ('meta_description', 'Premium baby garments crafted with love and organic materials.')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
