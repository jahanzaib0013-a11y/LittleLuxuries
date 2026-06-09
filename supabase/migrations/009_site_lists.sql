-- Global editable lists (sizes, categories, badges, size-chart templates).
-- Previously these lived only in the admin's browser localStorage; this table
-- makes them durable and shared across devices/admins and visible to the
-- storefront. One row per list, the array stored as JSON.
-- Safe to run multiple times.
CREATE TABLE IF NOT EXISTS site_lists (
  id TEXT PRIMARY KEY,            -- 'sizes' | 'categories' | 'badges' | 'size_chart_templates'
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reuse the shared updated_at trigger function (defined in earlier migrations).
DROP TRIGGER IF EXISTS update_site_lists_updated_at ON site_lists;
CREATE TRIGGER update_site_lists_updated_at BEFORE UPDATE ON site_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
