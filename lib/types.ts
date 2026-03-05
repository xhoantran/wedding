export type Locale = "en" | "vi";

export interface GalleryImage {
  src: string;
  alt: string;
  tall?: boolean;
}

export interface WeddingInfo {
  groomName: string;
  brideName: string;
  date: string;
  displayDate: string;
  ceremonyTime: string;
  receptionTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionVenue: string;
  receptionAddress: string;
  hashtag: string;
}
