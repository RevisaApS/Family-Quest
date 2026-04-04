-- Families table (parent accounts)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,  -- nullable for anonymous auth
  created_at TIMESTAMPTZ DEFAULT NOW(),
  adventure_style TEXT DEFAULT 'realistic' CHECK (adventure_style IN ('whimsical', 'realistic', 'dark')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  dice_preference TEXT DEFAULT 'digital' CHECK (dice_preference IN ('physical', 'digital')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'da'))
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 18),
  color TEXT DEFAULT '#f0a500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Dungeons & Dragons',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  state JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID REFERENCES adventures(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('warrior', 'wizard', 'rogue', 'ranger')),
  gender TEXT DEFAULT 'neutral' CHECK (gender IN ('male', 'female', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(adventure_id, player_id)
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own family" ON families
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own family" ON families
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own family" ON families
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own players" ON players
  FOR ALL USING (family_id = auth.uid());
CREATE POLICY "Users can manage own adventures" ON adventures
  FOR ALL USING (family_id = auth.uid());
CREATE POLICY "Users can manage own characters" ON characters
  FOR ALL USING (
    adventure_id IN (
      SELECT id FROM adventures WHERE family_id = auth.uid()
    )
  );
