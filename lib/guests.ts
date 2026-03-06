import "server-only";

import { readFileSync } from "fs";
import { join } from "path";
import { GuestData, GuestsMap } from "./types";

function loadGuests(): GuestsMap {
  const filePath = join(process.cwd(), "data", "guests.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as GuestsMap;
}

export function getGuest(code: string): GuestData | null {
  const guests = loadGuests();
  return guests[code] ?? null;
}

export function getGuestPhotosSet(code: string): Set<string> {
  const guest = getGuest(code);
  if (!guest) return new Set();
  return new Set(guest.photos);
}

export function getAllGuestCodes(): string[] {
  return Object.keys(loadGuests());
}
