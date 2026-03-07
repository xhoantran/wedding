-- RSVPs (upsert on invite_id)
CREATE TABLE rsvps (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invite_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  attendance TEXT NOT NULL,
  guests INT DEFAULT 0,
  meal TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Guest wishes
CREATE TABLE guest_wishes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poll votes (team groom / team bride)
CREATE TABLE poll_votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Song requests
CREATE TABLE song_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guest_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photo uploads
CREATE TABLE photos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guest_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Non-photo guests (managed via admin dashboard)
CREATE TABLE guests (
  id TEXT PRIMARY KEY,
  names TEXT[] NOT NULL,
  vn_title TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin notes per guest (upsert on guest_id)
CREATE TABLE guest_notes (
  guest_id TEXT PRIMARY KEY,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storage bucket for photo uploads
-- Create via Supabase Dashboard: Storage > New bucket > "wedding-photos" (public)
