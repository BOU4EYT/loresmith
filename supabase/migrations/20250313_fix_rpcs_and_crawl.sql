-- ============================================================
-- 1. Add last_synced_at to games so we know when to re-crawl
-- ============================================================
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Backfill: treat updated_at as last sync
UPDATE games SET last_synced_at = updated_at WHERE last_synced_at IS NULL;


-- ============================================================
-- 2. Crawl queue — deduplicates incoming app IDs
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_queue (
  app_id      int PRIMARY KEY,
  source      text NOT NULL,           -- 'top100_2w' | 'top100_forever' | 'new_releases' | 'manual'
  queued_at   timestamptz NOT NULL DEFAULT now(),
  attempts    int NOT NULL DEFAULT 0,
  last_error  text
);

-- ============================================================
-- 3. Sync log — one row per crawl run for observability
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id          bigserial PRIMARY KEY,
  run_at      timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL,
  queued      int NOT NULL DEFAULT 0,
  synced      int NOT NULL DEFAULT 0,
  errors      int NOT NULL DEFAULT 0,
  duration_ms int,
  details     jsonb
);


-- ============================================================
-- 4. Fix discover_games RPC
--    Old version had unguarded division → NaN when counts are 0
-- ============================================================
CREATE OR REPLACE FUNCTION discover_games(
  mechanic_slugs text[]  DEFAULT NULL,
  exclude_owned  uuid    DEFAULT NULL,
  lim            int     DEFAULT 48
)
RETURNS TABLE (
  id            int,
  slug          text,
  title         text,
  studio        text,
  genre         text,
  steam_pct     numeric,
  price_usd     numeric,
  is_free       boolean,
  header_image  text,
  tags          text[]
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id,
    g.slug,
    g.title,
    g.studio,
    -- genre = label of the highest-confidence mechanic
    (
      SELECT m.label
      FROM   game_mechanics gm
      JOIN   mechanics m ON m.id = gm.mechanic_id
      WHERE  gm.game_id = g.id
      ORDER  BY gm.confidence DESC
      LIMIT  1
    ) AS genre,
    -- steam_pct: NULL-safe division, rounds to integer, returns NULL if no reviews
    CASE
      WHEN COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0) = 0 THEN NULL
      ELSE ROUND(
        COALESCE(g.steam_positive, 0)::numeric
        / (COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0))::numeric
        * 100
      )
    END AS steam_pct,
    g.price_usd,
    COALESCE(g.is_free, false) AS is_free,
    g.header_image,
    -- tags = top 3 mechanic labels
    ARRAY(
      SELECT m.label
      FROM   game_mechanics gm
      JOIN   mechanics m ON m.id = gm.mechanic_id
      WHERE  gm.game_id = g.id
      ORDER  BY gm.confidence DESC
      LIMIT  3
    ) AS tags
  FROM games g
  WHERE
    -- mechanic filter (any of the requested slugs must match)
    (
      mechanic_slugs IS NULL
      OR EXISTS (
        SELECT 1
        FROM   game_mechanics gm
        JOIN   mechanics m ON m.id = gm.mechanic_id
        WHERE  gm.game_id = g.id
          AND  m.slug = ANY(mechanic_slugs)
      )
    )
    -- exclude games the user already owns
    AND (
      exclude_owned IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM user_library ul
        WHERE ul.game_id = g.id AND ul.user_id = exclude_owned
      )
    )
    -- only include games that have been synced (have a title)
    AND g.title IS NOT NULL
  ORDER BY
    -- prefer games with reviews over those without
    CASE WHEN COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0) > 0 THEN 0 ELSE 1 END,
    -- then by rating
    CASE
      WHEN COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0) = 0 THEN 0
      ELSE COALESCE(g.steam_positive, 0)::numeric
           / (COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0))::numeric
    END DESC,
    g.id
  LIMIT lim;
$$;


-- ============================================================
-- 5. Fix search_games RPC
--    Full-text search across title, studio, tags
-- ============================================================
CREATE OR REPLACE FUNCTION search_games(
  query text,
  lim   int DEFAULT 48
)
RETURNS TABLE (
  id            int,
  slug          text,
  title         text,
  studio        text,
  genre         text,
  steam_pct     numeric,
  price_usd     numeric,
  is_free       boolean,
  header_image  text,
  tags          text[]
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id,
    g.slug,
    g.title,
    g.studio,
    (
      SELECT m.label
      FROM   game_mechanics gm
      JOIN   mechanics m ON m.id = gm.mechanic_id
      WHERE  gm.game_id = g.id
      ORDER  BY gm.confidence DESC
      LIMIT  1
    ) AS genre,
    CASE
      WHEN COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0) = 0 THEN NULL
      ELSE ROUND(
        COALESCE(g.steam_positive, 0)::numeric
        / (COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0))::numeric
        * 100
      )
    END AS steam_pct,
    g.price_usd,
    COALESCE(g.is_free, false) AS is_free,
    g.header_image,
    ARRAY(
      SELECT m.label
      FROM   game_mechanics gm
      JOIN   mechanics m ON m.id = gm.mechanic_id
      WHERE  gm.game_id = g.id
      ORDER  BY gm.confidence DESC
      LIMIT  3
    ) AS tags
  FROM games g
  WHERE
    g.title IS NOT NULL
    AND (
      -- title match (case-insensitive)
      g.title ILIKE '%' || query || '%'
      -- studio match
      OR g.studio ILIKE '%' || query || '%'
      -- mechanic/tag match
      OR EXISTS (
        SELECT 1
        FROM   game_mechanics gm
        JOIN   mechanics m ON m.id = gm.mechanic_id
        WHERE  gm.game_id = g.id
          AND  m.label ILIKE '%' || query || '%'
      )
      -- steam tag match
      OR EXISTS (
        SELECT 1
        FROM   game_steam_tags gst
        JOIN   steam_tags st ON st.id = gst.tag_id
        WHERE  gst.game_id = g.id
          AND  st.label ILIKE '%' || query || '%'
      )
    )
  ORDER BY
    -- exact title match first
    CASE WHEN g.title ILIKE query THEN 0 ELSE 1 END,
    -- then starts-with
    CASE WHEN g.title ILIKE query || '%' THEN 0 ELSE 1 END,
    -- then by rating
    CASE
      WHEN COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0) = 0 THEN 0
      ELSE COALESCE(g.steam_positive, 0)::numeric
           / (COALESCE(g.steam_positive, 0) + COALESCE(g.steam_negative, 0))::numeric
    END DESC
  LIMIT lim;
$$;


-- ============================================================
-- 6. Map steam tags → mechanics automatically
--    Called after inserting game_steam_tags
-- ============================================================
CREATE TABLE IF NOT EXISTS steam_tag_mechanic_map (
  steam_label  text PRIMARY KEY,
  mechanic_slug text NOT NULL
);

-- Seed the mapping table (extend as needed)
INSERT INTO steam_tag_mechanic_map (steam_label, mechanic_slug) VALUES
  ('Action',               'combat'),
  ('Action RPG',           'combat'),
  ('Fighting',             'combat'),
  ('Shooter',              'combat'),
  ('FPS',                  'combat'),
  ('Third-Person Shooter', 'combat'),
  ('Hack and Slash',       'combat'),
  ('Souls-like',           'combat'),
  ('Tower Defense',        'strategy'),
  ('RTS',                  'strategy'),
  ('Turn-Based Strategy',  'turn-based'),
  ('Turn-Based Tactics',   'turn-based'),
  ('4X',                   'strategy'),
  ('Grand Strategy',       'strategy'),
  ('City Builder',         'basebuilding'),
  ('Base Building',        'basebuilding'),
  ('Colony Sim',           'basebuilding'),
  ('Crafting',             'crafting'),
  ('Survival',             'survival'),
  ('Open World Survival',  'survival'),
  ('Exploration',          'exploration'),
  ('Open World',           'exploration'),
  ('Metroidvania',         'exploration'),
  ('Puzzle',               'puzzle'),
  ('Puzzle Platformer',    'puzzle'),
  ('Logic',                'puzzle'),
  ('Horror',               'horror'),
  ('Psychological Horror', 'horror'),
  ('Survival Horror',      'horror'),
  ('RPG',                  'rpg'),
  ('JRPG',                 'rpg'),
  ('CRPG',                 'rpg'),
  ('Story Rich',           'narrative'),
  ('Narrative',            'narrative'),
  ('Visual Novel',         'narrative'),
  ('Adventure',            'narrative'),
  ('Point & Click',        'narrative'),
  ('Roguelite',            'roguelite'),
  ('Roguelike',            'roguelite'),
  ('Deckbuilder',          'roguelite'),
  ('Platformer',           'platformer'),
  ('2D Platformer',        'platformer'),
  ('3D Platformer',        'platformer'),
  ('Co-op',                'co-op'),
  ('Online Co-Op',         'co-op'),
  ('Local Co-Op',          'co-op'),
  ('Multiplayer',          'co-op'),
  ('Racing',               'racing'),
  ('Sports',               'sports'),
  ('Simulation',           'simulation'),
  ('Life Sim',             'simulation'),
  ('Farming Sim',          'simulation')
ON CONFLICT (steam_label) DO NOTHING;


-- ============================================================
-- 7. Helper: upsert mechanic from steam tag
--    Called by the sync pipeline to auto-tag games
-- ============================================================
CREATE OR REPLACE FUNCTION apply_steam_tag_mechanics(p_game_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT m.id AS mechanic_id
    FROM   game_steam_tags gst
    JOIN   steam_tags       st  ON st.id = gst.tag_id
    JOIN   steam_tag_mechanic_map stm ON stm.steam_label = st.label
    JOIN   mechanics         m   ON m.slug = stm.mechanic_slug
    WHERE  gst.game_id = p_game_id
  LOOP
    INSERT INTO game_mechanics (game_id, mechanic_id, confidence)
    VALUES (p_game_id, rec.mechanic_id, 0.7)
    ON CONFLICT (game_id, mechanic_id) DO NOTHING;
  END LOOP;
END;
$$;


-- ============================================================
-- 8. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_games_last_synced     ON games (last_synced_at);
CREATE INDEX IF NOT EXISTS idx_games_title_trgm      ON games USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_game_mechanics_game   ON game_mechanics (game_id);
CREATE INDEX IF NOT EXISTS idx_game_mechanics_mech   ON game_mechanics (mechanic_id);
CREATE INDEX IF NOT EXISTS idx_game_steam_tags_game  ON game_steam_tags (game_id);
CREATE INDEX IF NOT EXISTS idx_crawl_queue_queued_at ON crawl_queue (queued_at);

-- Enable pg_trgm if not already (needed for ILIKE performance at scale)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
