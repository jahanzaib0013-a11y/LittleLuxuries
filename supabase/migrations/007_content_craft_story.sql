-- Landing-page editable "craft story" section.
-- Stored as JSON so the eyebrow, headline, image, and chapters can be edited
-- from the admin Content tab. Safe to run multiple times.
ALTER TABLE content ADD COLUMN IF NOT EXISTS craft_story jsonb;
