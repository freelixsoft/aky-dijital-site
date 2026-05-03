import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://akydijital.com"),
  title: {
    default: "Aky Dijital | 360° Dijital Pazarlama Ajansı",
    template: "%s | Aky Dijital"
  },
  description:
    "Aky Dijital; Meta Ads, Google Ads, TikTok Ads, SEO, sosyal medya ve web tasarım hizmetleriyle markanızı dijitalde büyüten yeni nesil ajanstır.",
  keywords: [
    "dijital pazarlama ajansı",
    "Meta Ads yönetimi",
    "Google Ads yönetimi",
    "TikTok Ads",
    "SEO danışmanlığı",
    "performans pazarlaması",
    "web tasarım"
  ],
  openGraph: {
    title: "Aky Dijital | 360° Dijital Pazarlama Ajansı",
    description:
      "Reklam bütçenizi ölçülebilir büyümeye dönüştüren yeni nesil dijital pazarlama ajansı.",
    type: "website",
    locale: "tr_TR"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
