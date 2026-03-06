import { Locale } from "./types";

const translations = {
  en: {
    hero: {
      familyLine: "Together with their families",
      location: "Nha Trang, Vietnam",
      scroll: "Scroll",
    },
    nav: {
      details: "Details",
      gallery: "Gallery",
      rsvp: "RSVP",
    },
    countdown: {
      days: "Days",
      hours: "Hours",
      min: "Min",
      sec: "Sec",
    },
    details: {
      title: "Wedding Details",
      ceremony: "The Ceremony",
      reception: "The Reception",
      viewMap: "View Map",
    },
    quote: {
      text: "Whatever our souls are made of, his and mine are the same.",
      author: "Emily Bront\u00eb",
    },
    gallery: {
      title: "Our Moments",
      subtitle: "A collection of our favorite memories together",
      viewAll: "View All Photos",
    },
    rsvp: {
      title: "RSVP",
      subtitle: "We would be honored by your presence",
      name: "Full Name *",
      email: "Email Address *",
      attending: "Will you be attending? *",
      accept: "Joyfully Accept",
      decline: "Regretfully Decline",
      guests: "Number of Guests",
      meal: "Meal Preference",
      mealStandard: "Standard",
      mealVegetarian: "Vegetarian",
      mealVegan: "Vegan",
      mealOther: "Other Dietary Needs",
      message: "Message to the couple (optional)",
      send: "Send RSVP",
      sending: "Sending...",
      thankYou: "Thank You!",
      thankYouMessage:
        "We've received your response and can't wait to celebrate with you.",
      errorRequired: "Please fill in all required fields.",
      errorGeneric: "Something went wrong. Please try again.",
    },
  },
  vi: {
    hero: {
      familyLine: "Cùng với gia đình hai bên",
      location: "Nha Trang, Việt Nam",
      scroll: "Cuộn",
    },
    nav: {
      details: "Chi Tiết",
      gallery: "Hình Ảnh",
      rsvp: "Xác Nhận",
    },
    countdown: {
      days: "Ngày",
      hours: "Giờ",
      min: "Phút",
      sec: "Giây",
    },
    details: {
      title: "Chi Tiết Lễ Cưới",
      ceremony: "Lễ Thành Hôn",
      reception: "Tiệc Cưới",
      viewMap: "Xem Bản Đồ",
    },
    quote: {
      text: "D\u00f9 t\u00e2m h\u1ed3n ch\u00fang ta \u0111\u01b0\u1ee3c t\u1ea1o n\u00ean t\u1eeb \u0111i\u1ec1u g\u00ec, th\u00ec c\u1ee7a anh v\u00e0 em \u0111\u1ec1u l\u00e0 m\u1ed9t.",
      author: "Emily Bront\u00eb",
    },
    gallery: {
      title: "Khoảnh Khắc",
      subtitle: "Bộ sưu tập những kỷ niệm đẹp nhất của chúng tôi",
      viewAll: "Xem Tất Cả Ảnh",
    },
    rsvp: {
      title: "Xác Nhận Tham Dự",
      subtitle: "Chúng tôi rất hân hạnh được đón tiếp bạn",
      name: "Họ và Tên *",
      email: "Địa chỉ Email *",
      attending: "Bạn có tham dự không? *",
      accept: "Vui Lòng Nhận Lời",
      decline: "Rất Tiếc Từ Chối",
      guests: "Số Lượng Khách",
      meal: "Sở Thích Ẩm Thực",
      mealStandard: "Bình thường",
      mealVegetarian: "Chay",
      mealVegan: "Thuần chay",
      mealOther: "Yêu cầu khác",
      message: "Lời nhắn gửi cô dâu chú rể (tùy chọn)",
      send: "Gửi Xác Nhận",
      sending: "Đang gửi...",
      thankYou: "Cảm Ơn Bạn!",
      thankYouMessage:
        "Chúng tôi đã nhận được phản hồi của bạn và rất mong được cùng bạn chia sẻ niềm vui.",
      errorRequired: "Vui lòng điền đầy đủ các trường bắt buộc.",
      errorGeneric: "Đã xảy ra lỗi. Vui lòng thử lại.",
    },
  },
} as const;

export type Translations = (typeof translations)[Locale];

export function getTranslations(locale: Locale) {
  return translations[locale];
}
