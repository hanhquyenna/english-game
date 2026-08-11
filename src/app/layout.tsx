import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/**
 * The entire product is in Vietnamese, so the type has to carry Vietnamese
 * diacritics properly — Geist ships latin only, which would drop ế/ữ/ạ/ồ to a
 * system fallback and make the UI look broken in exactly the places that matter.
 */
const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beeblast",
  description:
    "Luyện tập tiếng Anh mỗi ngày theo đúng chương trình trên lớp — trình độ CEFR thật, minh bạch, cập nhật theo thời gian thực.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
