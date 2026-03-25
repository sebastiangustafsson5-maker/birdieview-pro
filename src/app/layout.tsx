import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BirdieView Pro",
  description: "Avancerad golfanalys-app fokuserad på shot-by-shot-loggning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BirdieView",
  },
};

export const viewport: Viewport = {
  themeColor: "#4C6444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-golf-light text-golf-beige antialiased`}>
        {children}
      </body>
    </html>
  );
}
