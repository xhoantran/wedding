export type Locale = "en" | "vi";

export interface GalleryImage {
  src: string;
  alt: string;
  tall?: boolean;
}

export interface GuestData {
  id: string;
  names: string[];
  vnTitle?: string;
  avatar: string;
  featuredPhotos: string[];
  photos: string[];
  message?: string;
}

export type GuestsMap = Record<string, GuestData>;

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
