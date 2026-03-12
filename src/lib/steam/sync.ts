import { getSteamProfile } from "@/lib/steam/api";

const STORE_BASE_URL = "https://store.steampowered.com/api/appdetails";
const STEAMSPY_BASE_URL = "https://steamspy.com/api.php";

type SteamStoreResponse = {
  success?: boolean;
  data?: {
    steam_appid?: number;
    name?: string;
    short_description?: string;
    detailed_description?: string;
    header_image?: string;
    genres?: Array<{ description?: string }>;
  };
};

async function safeJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function syncGameDetails(appId: number): Promise<void> {
  const res = await fetch(`${STORE_BASE_URL}?appids=${appId}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  const payload = await safeJson<Record<string, SteamStoreResponse>>(res);
  const game = payload?.[String(appId)];

  if (!game?.success) {
    throw new Error(`No store data for app ${appId}`);
  }
}

export async function syncReviews(appId: number): Promise<void> {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&num_per_page=0`;
  const res = await fetch(url, { next: { revalidate: 60 * 30 } });
  const data = await safeJson<{ success?: number }>(res);

  if (!data || data.success !== 1) {
    throw new Error(`Unable to fetch reviews for app ${appId}`);
  }
}

export async function syncSteamSpyTags(appId: number): Promise<void> {
  const res = await fetch(`${STEAMSPY_BASE_URL}?request=appdetails&appid=${appId}`, {
    next: { revalidate: 60 * 60 * 6 },
  });
  const data = await safeJson<Record<string, unknown>>(res);

  if (!data) {
    throw new Error(`Unable to fetch SteamSpy tags for app ${appId}`);
  }
}

// Keep this import referenced until profile sync is wired in.
void getSteamProfile;
