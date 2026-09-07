import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/lib/auth";
import { Leaf } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Croply",
  description: "Plant disease detection & farm management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gradient-to-br from-green-50/50 via-white to-teal-50/30 dark:from-neutral-950 dark:via-neutral-950 dark:to-emerald-950/20">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <Nav />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 animate-fade-in">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
