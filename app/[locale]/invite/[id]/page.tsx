import { getGuest } from "@/lib/guests";
import { Locale, GuestData } from "@/lib/types";
import InviteClient from "./InviteClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc: Locale = locale === "en" ? "en" : "vi";
  const guest = getGuest(id);
  const photos = guest?.photos ?? [];

  return (
    <InviteClient
      locale={loc}
      inviteId={id}
      guest={guest}
      guestPhotos={photos}
    />
  );
}
