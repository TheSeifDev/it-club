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
  title: "IT Club — Recruitment 2026",
  description:
    "Join IT Club. Learn, build, collaborate, and grow with a community of ambitious students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${alexandria.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}