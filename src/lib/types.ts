// Matches what the `discover_games` Supabase RPC returns.
// See src/app/api/games/sync/route.ts for the seeded game IDs.
export interface GameSummary {
  id:            number
  slug:          string
  title:         string
  studio:        string | null
  genre:         string | null   // top mechanic label or first Steam tag
  steam_pct:     number | null   // positive / (positive + negative) * 100
  price_usd:     number | null
  is_free:       boolean
  header_image:  string | null
  tags:          string[]        // mechanic labels (top 3)
  // Set by the page server component — not from the DB
  owned:         boolean
  playtime_mins: number
}

// Full detail shape used on /game/[slug]
export interface GameDetail extends Omit<GameSummary, 'tags'> {
  publisher:    string | null
  short_desc:   string | null
  description:  string | null
  release_date: string | null
  steam_url:    string | null
  steam_positive: number | null
  steam_negative: number | null
  tags:         string[]        // ← add this line
  mechanics: Array<{ slug: string; label: string; confidence: number }>
  wiki: {
    content:      string
    game_version: string
    is_outdated:  boolean
  } | null
  videos: Array<{
    youtube_id:   string
    title:        string
    game_version: string
    topic:        string
  }> | null
}

// Mechanic used in the sidebar filter
export interface Mechanic {
  slug:  string
  label: string
}
