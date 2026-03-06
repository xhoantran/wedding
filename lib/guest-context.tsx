"use client";

import { createContext, useContext } from "react";
import { GuestData } from "./types";

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
