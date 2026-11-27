import type { Metadata } from "next";
import { Alexandria, Montserrat } from "next/font/google";
import "./globals.css";

// CMS snapshots and authentication configuration are runtime concerns. A build
// without Supabase keys must not freeze the preview seed or login redirects.
export const dynamic = "force-dynamic";

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
    default: "IT Club | BATU",
    template: "%s | IT Club",
  },
  description:
    "A student-led technology community at Borg Al Arab Technological University. Learn, make, and move ideas forward together.",
  applicationName: "IT Club",
  authors: [{ name: "IT Club", url: "https://dev.itclub.one" }],
  generator: "Next.js",
  keywords: [
    "IT Club",
    "BATU",
    "Borg Al Arab Technological University",
    "Alexandria",
    "Student Technology Community",
  ],
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.webp", type: "image/webp", sizes: "32x32" },
      { url: "/icon-192.webp", type: "image/webp", sizes: "192x192" },
      { url: "/icon-512.webp", type: "image/webp", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "IT Club | BATU",
    description:
      "A student-led technology community at Borg Al Arab Technological University. Learn, make, and move ideas forward together.",
    url: "https://dev.itclub.one",
    siteName: "IT Club",
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Club | BATU",
    description:
      "A student-led technology community at Borg Al Arab Technological University.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${alexandria.variable} motion-reduce:scroll-auto!`}>
      <body>{children}</body>
    </html>
  );
}
