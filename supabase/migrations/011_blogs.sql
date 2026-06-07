-- Blog / Journal posts: managed in the admin "Blogs" tab, shown on the public
-- /blog pages. Anon-key app (custom admin auth) → permissive RLS like
-- content/site_lists. Safe to run multiple times.
CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT DEFAULT '',
  body TEXT DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',      -- 'draft' | 'published'
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status_pub ON blogs(status, published_at DESC);

DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on blogs" ON blogs;
CREATE POLICY "Allow all operations on blogs" ON blogs
  FOR ALL USING (true) WITH CHECK (true);
