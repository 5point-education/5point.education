import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "5 Point Education Hub | Coaching In Sonarpur",
    template: "%s | 5 Point Education Hub",
  },
  description: "School, board exam, NEET and JEE coaching with expert faculty and personalised attention in Sonarpur.",
  keywords: ["5 Point Education Hub", "Sonarpur coaching", "CBSE coaching", "JEE coaching", "NEET coaching"],
  openGraph: { title: "5 Point Education Hub", description: "Build your future with expert coaching in Sonarpur.", images: ["/landing/1.jpeg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
