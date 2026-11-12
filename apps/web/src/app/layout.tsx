import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "بصمة فن | معرض الإبداع الفني الرقمي",
  description: "كل طالب فنان.. وكل إبداع له بصمة. اكتشف معرض بصمة فن الرقمي.",
  applicationName: "MR Ghailene",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MR Ghailene", statusBarStyle: "default" },
  icons: { icon: "/icons/mr-ghailene-192.png", apple: "/icons/mr-ghailene-apple.png" },
  openGraph: {
    title: "بصمة فن | معرض الإبداع الفني الرقمي",
    description: "من أنامل صغيرة تنطلق إبداعات كبيرة.",
    locale: "ar_SA",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#241a1c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body><PwaRegistration />{children}</body>
    </html>
  );
}
