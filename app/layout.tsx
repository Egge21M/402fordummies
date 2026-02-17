import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "402 for Dummies | NUT-24 Landing",
  description:
    "A clean and technical guide to Cashu NUT-24 HTTP 402 payments, with flow diagrams and an interactive protocol demo.",
  openGraph: {
    title: "402 for Dummies | NUT-24 Landing",
    description: "A clean and technical guide to Cashu NUT-24 HTTP 402 payments, with flow diagrams and an interactive protocol demo.",
    url: "https://402fordummies.dev/",
    siteName: "402 for Dummies",
    images: [
      {
        url: "https://402fordummies.dev/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "402 for Dummies - A Reference for the Rest of Us!",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "402 for Dummies | NUT-24 Landing",
    description: "A clean and technical guide to Cashu NUT-24 HTTP 402 payments, with flow diagrams and an interactive protocol demo.",
    images: ["https://402fordummies.dev/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {modal}
      </body>
    </html>
  );
}
