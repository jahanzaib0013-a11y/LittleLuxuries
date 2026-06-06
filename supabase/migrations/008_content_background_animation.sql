-- Editable animated backdrop behind the hero (aurora / orbs / mesh / etc.).
-- Safe to run multiple times.
ALTER TABLE content ADD COLUMN IF NOT EXISTS background_animation text;
