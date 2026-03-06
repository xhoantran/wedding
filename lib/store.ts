import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WeddingStore {
  hasRsvped: boolean;
  setHasRsvped: () => void;
}

export const useWeddingStore = create<WeddingStore>()(
  persist(
    (set) => ({
      hasRsvped: false,
      setHasRsvped: () => set({ hasRsvped: true }),
    }),
    { name: "wedding-rsvp" }
  )
);
