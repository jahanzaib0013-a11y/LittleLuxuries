-- Per-product color variants with photos (JSON array)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.colors IS 'Array of { id, name, hex?, image_url, secondary_images?, is_default? }';
