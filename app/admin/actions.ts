"use server";

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { GuestsMap } from "@/lib/types";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

function loadJsonGuests(): GuestsMap {
  const filePath = join(process.cwd(), "data", "guests.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as GuestsMap;
}

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
  avatar: string;
  hasPhotos: boolean;
  photoCount: number;
  rsvpStatus: string;
  rsvpGuests: number;
  rsvpMeal: string;
  rsvpMessage: string;
  rsvpDate: string;
  note: string;
  ceremony: boolean;
}

export async function fetchGuestList(): Promise<GuestRow[]> {
  const jsonGuests = loadJsonGuests();

  const supabase = createClient(supabaseUrl, supabaseKey);
  const [{ data: rsvps }, { data: notes }, { data: dbGuests }] =
    await Promise.all([
      supabase.from("rsvps").select("*"),
      supabase.from("guest_notes").select("*"),
      supabase.from("guests").select("*"),
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

  const rows: GuestRow[] = [];

  // Photo guests from JSON
  for (const g of Object.values(jsonGuests)) {
    const rsvp = rsvpMap.get(g.id) as Record<string, unknown> | undefined;
    rows.push({
      id: g.id,
      names: g.names.join(" & "),
      vnTitle: (g.vnTitle ?? []).join(" & "),
      avatar: (g.avatar ?? [])[0] ?? "",
      hasPhotos: true,
      photoCount: g.photos.length,
      rsvpStatus: rsvp ? String(rsvp.attendance) : "pending",
      rsvpGuests: rsvp ? Number(rsvp.guests) || 0 : 0,
      rsvpMeal: rsvp ? String(rsvp.meal ?? "") : "",
      rsvpMessage: rsvp ? String(rsvp.message ?? "") : "",
      rsvpDate: rsvp?.updated_at ? String(rsvp.updated_at) : "",
      note: noteMap.get(g.id) ?? "",
      ceremony: g.ceremony ?? false,
    });
  }

  // Non-photo guests from Supabase
  for (const g of dbGuests ?? []) {
    // Skip if already in JSON (shouldn't happen, but safety check)
    if (jsonGuests[g.id]) continue;
    const rsvp = rsvpMap.get(g.id) as Record<string, unknown> | undefined;
    rows.push({
      id: g.id,
      names: (g.names as string[]).join(" & "),
      vnTitle: g.vn_title ?? "",
      avatar: g.avatar ?? "",
      hasPhotos: false,  // Supabase guests have string avatar
      photoCount: 0,
      rsvpStatus: rsvp ? String(rsvp.attendance) : "pending",
      rsvpGuests: rsvp ? Number(rsvp.guests) || 0 : 0,
      rsvpMeal: rsvp ? String(rsvp.meal ?? "") : "",
      rsvpMessage: rsvp ? String(rsvp.message ?? "") : "",
      rsvpDate: rsvp?.updated_at ? String(rsvp.updated_at) : "",
      note: noteMap.get(g.id) ?? "",
      ceremony: g.ceremony ?? false,
    });
  }

  return rows;
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

export async function createGuest(
  names: string[],
  vnTitle?: string,
  message?: string,
  ceremony?: boolean
): Promise<{ id: string } | { error: string }> {
  const id = randomUUID();
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from("guests").insert({
    id,
    names,
    vn_title: vnTitle || "",
    message: message || "",
    ceremony: ceremony ?? false,
  });

  if (error) {
    console.error("Error creating guest:", error);
    return { error: error.message };
  }
  return { id };
}

export async function deleteGuest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  // Safety: only allow deleting non-photo guests (Supabase guests)
  const jsonGuests = loadJsonGuests();
  if (jsonGuests[id]) {
    return { success: false, error: "Cannot delete photo guests" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from("guests").delete().eq("id", id);

  if (error) {
    console.error("Error deleting guest:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateGuestCeremony(id: string, ceremony: boolean) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from("guests")
    .update({ ceremony })
    .eq("id", id);

  if (error) {
    console.error("Error updating ceremony:", error);
    return false;
  }
  return true;
}

export interface PhotoGuestSummary {
  id: string;
  names: string[];
  avatar: string;
  photoCount: number;
}

export interface InviteGroup {
  members: string[];
  vnTitle?: string;
  message?: string;
}

export interface InviteGroupDisplay extends InviteGroup {
  memberDetails: PhotoGuestSummary[];
}

export async function fetchPhotoGuests(): Promise<PhotoGuestSummary[]> {
  const jsonGuests = loadJsonGuests();
  return Object.values(jsonGuests).map((g) => ({
    id: g.id,
    names: g.names,
    avatar: (g.avatar ?? [])[0] ?? "",
    photoCount: g.photos.length,
  }));
}

function loadInviteGroups(): InviteGroup[] {
  const filePath = join(process.cwd(), "scripts", "invite_groups.json");
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as InviteGroup[];
  } catch {
    return [];
  }
}

export async function fetchInviteGroups(): Promise<InviteGroupDisplay[]> {
  const groups = loadInviteGroups();
  const jsonGuests = loadJsonGuests();

  const guestMap = new Map(
    Object.values(jsonGuests).map((g) => [
      g.id,
      { id: g.id, names: g.names, avatar: (g.avatar ?? [])[0] ?? "", photoCount: g.photos.length },
    ])
  );

  return groups.map((group) => ({
    ...group,
    memberDetails: group.members
      .map((id) => guestMap.get(id))
      .filter((g): g is PhotoGuestSummary => !!g),
  }));
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

  const jsonGuests = loadJsonGuests();
  const { count: dbGuestCount } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true });

  counts["guests"] = Object.keys(jsonGuests).length + (dbGuestCount ?? 0);

  return counts;
}
