import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "@/components/common/theme-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const description =
  "OpenPanel is a self-hosted control panel to manage remote Linux servers over SSH — system metrics, services and processes, an SFTP file manager, and a web terminal.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OpenPanel — Remote Linux Server Manager",
    template: "%s · OpenPanel",
  },
  description,
  applicationName: "OpenPanel",
  keywords: [
    "OpenPanel",
    "server management",
    "cPanel alternative",
    "SSH",
    "Linux",
    "control panel",
    "web terminal",
    "SFTP file manager",
    "systemd services",
    "self-hosted",
  ],
  authors: [{ name: "OpenPanel" }],
  creator: "OpenPanel",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "OpenPanel",
    title: "OpenPanel — Remote Linux Server Manager",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPanel — Remote Linux Server Manager",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
