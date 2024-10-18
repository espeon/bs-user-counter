import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bluesky User Counter',
  description: 'Real-time Bluesky user count with interpolation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ThemeProvider defaultTheme="system" attribute='class'>
      <body className={inter.className}>
          {children}
      </body>
      </ThemeProvider>
    </html>
  );
}