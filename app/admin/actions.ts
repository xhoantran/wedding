"use server";

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { GuestsMap } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function fetchTableData(table: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
  return data ?? [];
}

export interface GuestRow {
  id: string;
  names: string;
  vnTitle: string;
  photos: number;
  rsvpStatus: string;
  rsvpGuests: number;
  rsvpMeal: string;
  rsvpMessage: string;
  rsvpDate: string;
  note: string;
}

export async function fetchGuestList(): Promise<GuestRow[]> {
  const filePath = join(process.cwd(), "data", "guests.json");
  const raw = readFileSync(filePath, "utf-8");
  const guests = JSON.parse(raw) as GuestsMap;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const [{ data: rsvps }, { data: notes }] = await Promise.all([
    supabase.from("rsvps").select("*"),
    supabase.from("guest_notes").select("*"),
  ]);

  const rsvpMap = new Map(
    (rsvps ?? []).map((r: Record<string, unknown>) => [
      r.invite_id as string,
      r,
    ])
  );
  const noteMap = new Map(
    (notes ?? []).map((n: Record<string, unknown>) => [
      n.guest_id as string,
      String(n.note ?? ""),
    ])
  );

  return Object.values(guests).map((g) => {
    const rsvp = rsvpMap.get(g.id) as Record<string, unknown> | undefined;
    return {
      id: g.id,
      names: g.names.join(" & "),
      vnTitle: g.vnTitle ?? "",
      photos: g.photos.length,
      rsvpStatus: rsvp ? String(rsvp.attendance) : "pending",
      rsvpGuests: rsvp ? Number(rsvp.guests) || 0 : 0,
      rsvpMeal: rsvp ? String(rsvp.meal ?? "") : "",
      rsvpMessage: rsvp ? String(rsvp.message ?? "") : "",
      rsvpDate: rsvp?.updated_at ? String(rsvp.updated_at) : "",
      note: noteMap.get(g.id) ?? "",
    };
  });
}

export async function saveGuestNote(guestId: string, note: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from("guest_notes")
    .upsert({ guest_id: guestId, note }, { onConflict: "guest_id" });

  if (error) {
    console.error("Error saving note:", error);
    return false;
  }
  return true;
}

export async function fetchAllCounts() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tables = [
    "rsvps",
    "guest_wishes",
    "poll_votes",
    "photos",
    "song_requests",
  ];

  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = error ? 0 : (count ?? 0);
    })
  );

  const filePath = join(process.cwd(), "data", "guests.json");
  const raw = readFileSync(filePath, "utf-8");
  const guests = JSON.parse(raw) as GuestsMap;
  counts["guests"] = Object.keys(guests).length;

  return counts;
}
