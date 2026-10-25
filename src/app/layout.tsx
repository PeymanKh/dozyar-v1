import type { Metadata, Viewport } from "next";
import { Estedad, Vazirmatn } from "next/font/google";
import "./globals.css";

// Display font: headlines and big numbers.
const estedad = Estedad({
  variable: "--font-estedad",
  subsets: ["arabic", "latin"],
  display: "swap",
  // next/font has no fallback metrics for Estedad yet; Turbopack may still log a harmless warning.
  adjustFontFallback: false,
});

// Text font: everything people read.
const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دوزیار",
  description: "همراه روزانه‌ی درمان دارویی؛ یادآور دوز، ثبت علائم و پیشرفت.",
  applicationName: "دوزیار",
  appleWebApp: {
    capable: true,
    title: "دوزیار",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F5FF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${estedad.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Phone-width column; on larger screens it sits centered on the canvas. */}
        <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-bg-canvas print:max-w-none">{children}</div>
      </body>
    </html>
  );
}
