import "server-only";

import { readFileSync } from "fs";
import { join } from "path";
import { GuestData, GuestsMap } from "./types";

function loadGuests(): GuestsMap {
  const filePath = join(process.cwd(), "data", "guests.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as GuestsMap;
}

export function getGuest(id: string): GuestData | null {
  const guests = loadGuests();
  return guests[id] ?? null;
}

export function getGuestPhotosSet(id: string): Set<string> {
  const guest = getGuest(id);
  if (!guest) return new Set();
  return new Set(guest.photos);
}

export function getAllGuestIds(): string[] {
  return Object.values(loadGuests()).map((g) => g.id);
}
