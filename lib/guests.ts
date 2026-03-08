import "server-only";

import { readFileSync } from "fs";
import { join } from "path";
import { GuestData, GuestsMap } from "./types";
import { createClient } from "@supabase/supabase-js";

// Module-level cache for JSON guests
let jsonGuestsCache: GuestsMap | null = null;

function loadJsonGuests(): GuestsMap {
  if (!jsonGuestsCache) {
    const filePath = join(process.cwd(), "data", "guests.json");
    const raw = readFileSync(filePath, "utf-8");
    jsonGuestsCache = JSON.parse(raw) as GuestsMap;
  }
  return jsonGuestsCache;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
}

async function markAsSeen(id: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("invites")
    .upsert(
      { id, is_seen: true, seen_at: new Date().toISOString() },
      { onConflict: "id" }
    );
}

export async function getGuest(id: string): Promise<GuestData | null> {
  // Mark invite as seen (fire-and-forget)
  markAsSeen(id);

  // Check JSON (photo guests) first
  const jsonGuests = loadJsonGuests();
  if (jsonGuests[id]) {
    return jsonGuests[id];
  }

  // Fallback to Supabase (non-photo guests)
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    names: data.names,
    vnTitle: data.vn_title ? [data.vn_title] : undefined,
    avatar: data.avatar ? [data.avatar] : [],
    featuredPhotos: [],
    photos: [],
    message: data.message || undefined,
    ceremony: data.ceremony ?? false,
  };
}

export function getGuestPhotosSet(id: string): Set<string> {
  const jsonGuests = loadJsonGuests();
  const guest = jsonGuests[id];
  if (!guest) return new Set();
  return new Set(guest.photos);
}

export function getAllJsonGuests(): GuestsMap {
  return loadJsonGuests();
}
