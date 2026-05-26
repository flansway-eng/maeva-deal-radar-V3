import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#C4974C",
  width: "device-width",
  initialScale: 1,
};

/* — Corps principal : Inter (institutional sans) — */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* — Display / titres : Cormorant Garamond (serif élégant) — */
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

/* — Monospace : Geist Mono — */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maeva Deal Radar Room",
  description: "Cockpit institutionnel de prospection M&A & Private Equity",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deal Radar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
