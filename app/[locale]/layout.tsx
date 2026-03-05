import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "../globals.css";
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return locale === "vi"
    ? {
        title: "Hoan & Thy — Đám Cưới",
        description:
          "Hãy cùng chúng tôi chào mừng lễ cưới của Hoan và Thy. Chúng tôi rất mong được chia sẻ ngày đặc biệt này cùng bạn.",
      }
    : {
        title: "Hoan & Thy — Our Wedding",
        description:
          "Join us in celebrating the wedding of Hoan and Thy. We can't wait to share this special day with you.",
      };
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "vi" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body
        className={`${cormorant.variable} ${montserrat.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
