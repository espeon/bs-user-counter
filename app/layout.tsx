import "./globals.css";
import type { Metadata } from "next";
import Head from 'next/head'
import Script from 'next/script'
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const mono = IBM_Plex_Mono({ weight: "400", subsets: ["latin"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "Bcounter",
  description: "Almost-real-time Bluesky user count",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
      <Script defer src="https://watson.nat.vg/script.js" data-website-id="c886b50e-c028-4838-990c-8a2451e73201"></Script>
        </Head>
      <body className={inter.className + "," + mono.className}>
        <ThemeProvider defaultTheme="system" attribute="class">
          {children}
        </ThemeProvider>
        <script defer src="https://watson.nat.vg/script.js" data-website-id="c886b50e-c028-4838-990c-8a2451e73201"></script>
      </body>
    </html>
  );
}
