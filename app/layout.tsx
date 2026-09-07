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
          <footer className="border-t border-green-900/10 bg-white/50 py-4 text-center text-xs text-gray-500 backdrop-blur-sm dark:border-green-100/10 dark:bg-neutral-900/50">
            <div className="mx-auto max-w-7xl px-4">
              <span className="inline-flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-green-500 animate-pulse-glow" />
                Croply — plant disease detection &amp; farm management
              </span>
              <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                Made with ❤️ for farmers worldwide
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
