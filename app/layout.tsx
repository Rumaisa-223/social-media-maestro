import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display, Mrs_Saint_Delafield, Great_Vibes, Bebas_Neue } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientProviders } from "@/components/client-providers" // 👈 New import
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const saintDelafield = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], variable: "--font-signature" })
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-script" })
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" })

export const metadata: Metadata = {
  title: "Social Media Maestro",
  description: "Master your social media strategy",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${saintDelafield.variable} ${greatVibes.variable} ${bebas.variable}`}>
      <body className={inter.className}>
        <ClientProviders> {/* 👈 Wrap children in client-side providers */}
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  )
}
