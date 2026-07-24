import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { IM_Fell_English, Alegreya } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
// IM Fell English: a digitization of genuine 17th-century book type — the
// display voice of the storybook. Alegreya: a text face designed for
// literature, warm and highly readable aloud.
const fellEnglish = IM_Fell_English({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
})
const alegreya = Alegreya({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-body",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#211812",
}

export const metadata: Metadata = {
  title: "Family Quest",
  description: "AI-powered D&D adventures for families",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS ignores the web manifest when you Add to Home Screen — without this
    // link the iPad shows a blank screenshot instead of an icon.
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Likewise, `display: standalone` in the manifest does nothing on iOS. This
  // is what makes the home-screen launch run fullscreen with no Safari chrome.
  appleWebApp: {
    capable: true,
    title: "Family Quest",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fellEnglish.variable} ${alegreya.variable} dark antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
