import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { TopBar } from "@/components/top-bar";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Console — Agentic OS",
  description: "Your AI C-suite. On your machine. Yours to keep.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased font-sans">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Nav />
            <main className="flex-1 overflow-x-hidden flex flex-col">
              <TopBar />
              <div className="flex-1">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
