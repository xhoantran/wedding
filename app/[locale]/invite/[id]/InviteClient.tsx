"use client";

import { useMemo } from "react";
import { GuestProvider } from "@/lib/guest-context";
import { Locale, GuestData } from "@/lib/types";
import WeddingPage from "@/components/WeddingPage";

export default function InviteClient({
  locale,
  inviteId,
  guest,
  guestPhotos,
}: {
  locale: Locale;
  inviteId: string;
  guest: GuestData | null;
  guestPhotos: string[];
}) {
  const photosSet = useMemo(() => new Set(guestPhotos), [guestPhotos]);

  return (
    <GuestProvider
      value={{ guest, code: inviteId, inviteId, guestPhotos: photosSet }}
    >
      <WeddingPage locale={locale} />
    </GuestProvider>
  );
}
