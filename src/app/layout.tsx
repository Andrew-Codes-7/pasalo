import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers, THEME_SCRIPT } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pasalo — Dalo. Encontralo. Pasalo.",
  description:
    "Give, find, and pass on things with your neighbors in Playas del Coco.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script below deliberately rewrites `class` and `lang` before React
    // hydrates, so a mismatch on this element is expected, not a bug.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the saved theme before paint so dark-mode users never see
            a white flash on load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-content">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
