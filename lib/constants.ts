import { WeddingInfo, GalleryImage, Locale } from "./types";
import { getTranslations } from "./i18n";

export const WEDDING: WeddingInfo = {
  groomName: "Hoan",
  brideName: "Thy",
  date: "2027-01-17",
  displayDate: "January 17, 2027",
  ceremonyTime: "10:00 AM",
  receptionTime: "6:00 PM",
  ceremonyVenue: "Nhà thờ Núi - Nha Trang Cathedral",
  ceremonyAddress: "27 Thái Nguyên, Phước Tân, Nha Trang, Khánh Hòa, Vietnam",
  receptionVenue: "InterContinental Nha Trang",
  receptionAddress: "32-34 Trần Phú, phường, Nha Trang, Khánh Hòa, Vietnam",
  hashtag: "#HoanAndThy2027",
};

export function getDisplayDate(locale: Locale): string {
  return locale === "vi" ? "17 Tháng 1, 2027" : "January 17, 2027";
}

export const HERO_IMAGE = "/images/hero.jpg";

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: "/images/gallery/LEE_8679.JPG", alt: "Couple photo 1", tall: true },
  { src: "/images/gallery/LEE_8756.JPG", alt: "Couple photo 2" },
  { src: "/images/gallery/LEE_8895.JPG", alt: "Couple photo 3" },
  { src: "/images/gallery/LEE_8938.JPG", alt: "Couple photo 4", tall: true },
  { src: "/images/gallery/LEE_9186.JPG", alt: "Couple photo 5" },
  { src: "/images/gallery/LEE_9189.JPG", alt: "Couple photo 6" },
  { src: "/images/gallery/LEE_9293.JPG", alt: "Couple photo 7" },
  { src: "/images/gallery/LEE_9386.JPG", alt: "Couple photo 8", tall: true },
  { src: "/images/gallery/LEE_9418.JPG", alt: "Couple photo 9" },
  { src: "/images/gallery/LEE_9428.JPG", alt: "Couple photo 10" },
  { src: "/images/gallery/LEE_9434.JPG", alt: "Couple photo 11" },
  { src: "/images/gallery/LEE_9684.JPG", alt: "Couple photo 12" },
];

export function getNavLinks(locale: Locale) {
  const t = getTranslations(locale).nav;
  return [
    { label: t.details, href: "#details" },
    { label: t.gallery, href: "#gallery" },
    { label: t.rsvp, href: "#rsvp" },
  ];
}
