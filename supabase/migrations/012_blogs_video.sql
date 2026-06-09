-- Optional video for a blog post (YouTube / Vimeo / direct MP4 URL).
-- Shown on the public article page. Safe to run multiple times.
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS video_url TEXT;
