import type { Metadata } from "next";
import { Alexandria, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dev.itclub.one"),
  title: {
    default: "IT Club — Recruitment 2026 | BATU",
    template: "%s | IT Club",
  },
  description:
    "Join IT Club at Borg Al Arab Technological University. Learn, build, collaborate, and grow with a community of ambitious students.",
  applicationName: "IT Club",
  authors: [{ name: "IT Club", url: "https://dev.itclub.one" }],
  generator: "Next.js",
  keywords: [
    "IT Club",
    "BATU",
    "Borg Al Arab Technological University",
    "Student Technology Club",
    "Recruitment 2026",
    "Engineering",
    "Computer Science",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.webp", type: "image/webp", sizes: "32x32" },
      { url: "/icon-192.webp", type: "image/webp", sizes: "192x192" },
      { url: "/icon-512.webp", type: "image/webp", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "IT Club — Recruitment 2026 | BATU",
    description:
      "Join IT Club at Borg Al Arab Technological University. Learn, build, collaborate, and grow with a community of ambitious students.",
    url: "https://dev.itclub.one",
    siteName: "IT Club",
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    type: "website",
    images: [
      {
        url: "/og-itclub.webp",
        width: 1200,
        height: 630,
        alt: "IT Club — Recruitment 2026 | BATU",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Club — Recruitment 2026 | BATU",
    description:
      "Join IT Club at Borg Al Arab Technological University. Learn, build, collaborate, and grow with a community of ambitious students.",
    images: ["/og-itclub.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${alexandria.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}