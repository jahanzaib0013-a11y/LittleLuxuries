-- Landing-page entrance animation style (site-wide), chosen in the Content editor.
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS animation_style text NOT NULL DEFAULT 'rise';

COMMENT ON COLUMN content.animation_style IS
  'Landing page entrance animation: none | fade | rise | luxe | slide';
