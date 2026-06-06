-- Per-product advanced size chart (custom grid + measurement guide), stored as JSON.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_chart JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.size_chart IS
  'Size chart: { enabled, baseUnit, allowUnitToggle, howToMeasure, measureImageUrl, columns: [{ id, label, kind }], rows: [{ id, cells: { columnId: value } }] }';
