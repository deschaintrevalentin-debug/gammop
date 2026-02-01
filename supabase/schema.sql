-- ============================================================
-- GAMMOP - Schema Supabase
-- Execute ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. Table : seasons
CREATE TABLE IF NOT EXISTS seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game TEXT NOT NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    players TEXT[] NOT NULL,
    is_special BOOLEAN DEFAULT false,
    special_number INTEGER,
    organizer TEXT,
    speciality TEXT,
    gdoc_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_date ON seasons (date DESC);
CREATE INDEX IF NOT EXISTS idx_seasons_game ON seasons (game);

-- 2. Table : discord_profiles
CREATE TABLE IF NOT EXISTS discord_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pseudo TEXT NOT NULL UNIQUE,
    discord_user_id TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discord_profiles_pseudo ON discord_profiles (pseudo);

-- 3. Table : merge_history
CREATE TABLE IF NOT EXISTS merge_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_pseudos TEXT[] NOT NULL,
    target_pseudo TEXT NOT NULL,
    merged_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_history ENABLE ROW LEVEL SECURITY;

-- SEASONS
CREATE POLICY "seasons_select_public" ON seasons
    FOR SELECT USING (true);

CREATE POLICY "seasons_insert_auth" ON seasons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "seasons_update_auth" ON seasons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "seasons_delete_auth" ON seasons
    FOR DELETE USING (auth.role() = 'authenticated');

-- DISCORD_PROFILES
CREATE POLICY "discord_profiles_select_public" ON discord_profiles
    FOR SELECT USING (true);

CREATE POLICY "discord_profiles_insert_auth" ON discord_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "discord_profiles_update_auth" ON discord_profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "discord_profiles_delete_auth" ON discord_profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- MERGE_HISTORY
CREATE POLICY "merge_history_select_public" ON merge_history
    FOR SELECT USING (true);

CREATE POLICY "merge_history_insert_auth" ON merge_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "merge_history_update_auth" ON merge_history
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "merge_history_delete_auth" ON merge_history
    FOR DELETE USING (auth.role() = 'authenticated');
