CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  subject TEXT,
  category TEXT,
  attributes TEXT[],
  caption TEXT,
  confidence REAL,
  needs_review BOOLEAN DEFAULT FALSE,
  embedding REAL[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding REAL[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  image_id INTEGER REFERENCES images(id),
  similarity_score REAL,
  guard_status TEXT NOT NULL,
  guard_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER REFERENCES suggestions(id),
  decision TEXT NOT NULL,
  reviewer_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_log (
  id SERIAL PRIMARY KEY,
  call_type TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_post ON suggestions(post_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_image ON suggestions(image_id);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
