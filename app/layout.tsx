import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "402 for Dummies | NUT-24 Landing",
  description:
    "A clean and technical guide to Cashu NUT-24 HTTP 402 payments, with flow diagrams and an interactive protocol demo.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png", rel: "icon" },
      { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png", rel: "icon" },
    ],
  },
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
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        {modal}
      </body>
    </html>
  );
}
