import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Who's the Impostor: Twist Edition",
  description:
    "A modern multiplayer social deduction party game with unique twists every round. Play with 4-12 players, earn rewards, and climb the ranks!",
  keywords: ["multiplayer", "social deduction", "party game", "impostor", "online game"],
  openGraph: {
    title: "Who's the Impostor: Twist Edition",
    description: "A modern multiplayer social deduction game with unique twists every round!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <Providers>
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute top-1/3 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
