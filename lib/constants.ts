import { WeddingInfo, GalleryImage, Locale } from "./types";
import { getTranslations } from "./i18n";

export const WEDDING: WeddingInfo = {
  groomName: "Hoan",
  brideName: "Thy",
  date: "2027-01-17",
  displayDate: "January 17, 2027",
  ceremonyTime: "10:00 AM",
  receptionTime: "6:00 PM",
  ceremonyVenue: "",
  ceremonyAddress: "761 Đường 23/10, Tây Nha Trang, Khánh Hòa, Việt Nam",
  receptionVenue: "InterContinental Nha Trang",
  receptionAddress: "32-34 Trần Phú, phường, Nha Trang, Khánh Hòa, Việt Nam",
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

export const ALL_GALLERY_IMAGES: GalleryImage[] = [
  "LEE_8619", "LEE_8674", "LEE_8679", "LEE_8681", "LEE_8697",
  "LEE_8756", "LEE_8852", "LEE_8853", "LEE_8854", "LEE_8868",
  "LEE_8895", "LEE_8902", "LEE_8908", "LEE_8918", "LEE_8938",
  "LEE_8967", "LEE_8980", "LEE_8981", "LEE_8994", "LEE_9004",
  "LEE_9186", "LEE_9187", "LEE_9189", "LEE_9209", "LEE_9211",
  "LEE_9212", "LEE_9215", "LEE_9217", "LEE_9218", "LEE_9219",
  "LEE_9220", "LEE_9221", "LEE_9223", "LEE_9225", "LEE_9227",
  "LEE_9228", "LEE_9230", "LEE_9283", "LEE_9293", "LEE_9295",
  "LEE_9299", "LEE_9318", "LEE_9323", "LEE_9340", "LEE_9350",
  "LEE_9374", "LEE_9385", "LEE_9386", "LEE_9390", "LEE_9397",
  "LEE_9401", "LEE_9402", "LEE_9418", "LEE_9420", "LEE_9428",
  "LEE_9434", "LEE_9474", "LEE_9478", "LEE_9479", "LEE_9489",
  "LEE_9500", "LEE_9517", "LEE_9531", "LEE_9554", "LEE_9555",
  "LEE_9563", "LEE_9564", "LEE_9566", "LEE_9567", "LEE_9574",
  "LEE_9577", "LEE_9579", "LEE_9618", "LEE_9684", "LEE_9686",
  "LEE_9806", "LEE_9852",
].map((name, i) => ({
  src: `/images/gallery/${name}.JPG`,
  alt: `Wedding photo ${i + 1}`,
}));

export function getNavLinks(locale: Locale) {
  const t = getTranslations(locale).nav;
  return [
    { label: t.details, href: "#details" },
    { label: t.gallery, href: "#gallery" },
    { label: t.rsvp, href: "#rsvp" },
  ];
}
