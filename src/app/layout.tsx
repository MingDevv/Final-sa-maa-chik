import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const plexThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Final-sa-maa-chik — ติวสอบปลายภาค ม.4",
    template: "%s | Final-sa-maa-chik",
  },
  description:
    "แอปฝึกทำแนวข้อสอบปลายภาค ม.4 อ่านชีท PDF อ่านชีตสรุปก่อนสอบ ทำโจทย์ ทบทวนจุดอ่อน และติดตามความพร้อมก่อนสอบ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${plexThai.variable} font-sans antialiased`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 md:px-6">
              {children}
            </main>
            <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
              Final-sa-maa-chik · ทำด้วยความตั้งใจเพื่อการสอบปลายภาค
            </footer>
          </div>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
