-- Coordinated motion template (site-wide), chosen in the Content editor.
-- (Originally a single-layer "animation style"; now a bundled template.)
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS animation_style text NOT NULL DEFAULT 'couture';

-- Keep the default current for installs created before the template rename.
ALTER TABLE content ALTER COLUMN animation_style SET DEFAULT 'couture';

-- Fold the retired single-layer presets onto the new template vocabulary
-- (matches the remap the app applies on read).
UPDATE content SET animation_style = CASE animation_style
  WHEN 'rise'  THEN 'couture'
  WHEN 'fade'  THEN 'couture'
  WHEN 'luxe'  THEN 'couture'
  WHEN 'slide' THEN 'boutique'
  ELSE animation_style
END
WHERE animation_style IN ('rise', 'fade', 'luxe', 'slide');

COMMENT ON COLUMN content.animation_style IS
  'Coordinated motion template: none | editorial | boutique | couture';
