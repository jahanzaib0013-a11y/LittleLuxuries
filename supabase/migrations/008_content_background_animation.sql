-- Editable animated backdrop behind the hero, chosen in the Content editor.
-- Safe to run multiple times.
ALTER TABLE content ADD COLUMN IF NOT EXISTS background_animation text;
ALTER TABLE content ALTER COLUMN background_animation SET DEFAULT 'orbs';

-- Retired variants fold onto "orbs" (matches the remap the app applies on read).
UPDATE content SET background_animation = 'orbs'
WHERE background_animation IN ('aurora', 'mesh');

COMMENT ON COLUMN content.background_animation IS
  'Hero backdrop: none | orbs | bubbles | twinkle | confetti | shimmer | waves | petals';
