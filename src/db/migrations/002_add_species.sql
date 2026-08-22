ALTER TABLE images ADD COLUMN IF NOT EXISTS species TEXT;
CREATE INDEX IF NOT EXISTS idx_images_species ON images(species);
