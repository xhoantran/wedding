"use client";

import { useParams } from "next/navigation";
import { Locale } from "@/lib/types";
import WeddingPage from "@/components/WeddingPage";

export default function Home() {
  const params = useParams<{ locale: Locale }>();
  const locale = params.locale === "en" ? "en" : "vi";

  return <WeddingPage locale={locale} />;
}
