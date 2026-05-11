import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/components/providers/SocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Editorial serif — matches pricing-table tone from your reference */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Keep tab text minimal so favicon/logo is visually dominant.
  title: " ",
  description: "Modern social CRM platform for managing customer conversations",
  icons: {
    icon: [
      { url: '/intra.logo.1.png', type: 'image/png' },
    ],
    shortcut: '/intra.logo.1.png',
    apple: '/intra.logo.1.png',
  },
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`${sourceSerif.className} antialiased`}>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
