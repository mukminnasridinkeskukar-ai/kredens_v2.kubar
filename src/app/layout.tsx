import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KREDENS v2.kubar — Kredensial Tenaga Medis & Kesehatan Kutai Barat",
  description:
    "Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan Kabupaten Kutai Barat. Satu pintu pengajuan, penilaian, rekomendasi, dan surat penugasan klinis.",
  keywords: ["KREDENS", "kredensial", "tenaga kesehatan", "Kutai Barat", "Dinas Kesehatan", "RKK", "SPK"],
  authors: [{ name: "Dinas Kesehatan Kabupaten Kutai Barat" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
