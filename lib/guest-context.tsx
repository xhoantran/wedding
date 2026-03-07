"use client";

import { createContext, useContext } from "react";
import { GuestData, Locale } from "./types";

interface GuestContextValue {
  guest: GuestData | null;
  code: string | null;
  inviteId: string | null;
  guestPhotos: Set<string>;
}

const GuestContext = createContext<GuestContextValue>({
  guest: null,
  code: null,
  inviteId: null,
  guestPhotos: new Set(),
});

export const GuestProvider = GuestContext.Provider;
export function useGuest() {
  return useContext(GuestContext);
}

export function getGuestDisplayName(guest: GuestData, _locale: Locale): string {
  if (guest.vnTitle?.length) {
    return guest.names
      .map((name, i) => {
        const title = guest.vnTitle?.[i];
        return title ? `${title} ${name}` : name;
      })
      .join(" & ");
  }
  return guest.names.join(" & ");
}
